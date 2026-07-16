// Base HTTP client for talking to the AmanGuard Spring Boot backend.
// Backend base URL is configurable via VITE_API_BASE_URL (see .env.example).
//
// Auth: every request carries the stored JWT access token (localStorage
// "amanguard_token") as an Authorization header. When the access token expires
// the backend answers 401; the client transparently exchanges the stored
// refresh token ("amanguard_refresh_token") for a fresh access token via
// POST /auth/refresh and replays the original request — the whole dance is
// invisible to the user, no reload, no login screen. Only if the refresh
// itself fails (refresh token missing/expired/invalid) do we clear the session
// and dispatch "amanguard:unauthorized" so AppContext returns to the login view.

export const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api";

export const TOKEN_KEY = "amanguard_token";
export const REFRESH_TOKEN_KEY = "amanguard_refresh_token";
export const USER_KEY = "amanguard_user";

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

// ── Token refresh coordination ────────────────────────────────────────────
// A burst of requests can all 401 at nearly the same moment. Only the first
// one performs the actual /auth/refresh; the rest park their resolvers in
// failedQueue and are released once the single refresh settles, so we never
// fire multiple simultaneous refresh calls (and never rotate the refresh token
// more than once per expiry).
let isRefreshing = false;
let failedQueue = [];

function processQueue(error, token = null) {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(token);
  });
  failedQueue = [];
}

async function refreshAccessToken() {
  const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
  if (!refreshToken) throw new Error("No refresh token");

  const res = await fetch(`${BASE_URL}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  });

  if (!res.ok) throw new Error("Refresh failed");
  const data = await res.json();
  localStorage.setItem(TOKEN_KEY, data.token);
  if (data.refreshToken) {
    localStorage.setItem(REFRESH_TOKEN_KEY, data.refreshToken);
  }
  // Keep the browser extension in sync with the refreshed token (silent).
  if (typeof window !== "undefined") {
    window.postMessage({
      source: "AMANGUARD_WEB",
      action: "SET_AMANGUARD_TOKEN",
      token: data.token,
      user: localStorage.getItem(USER_KEY),
    }, window.location.origin);
  }
  return data.token;
}

// The refresh token is gone/expired/invalid — the session can't be salvaged.
// Clear it and notify the app so it drops back to the login screen.
function clearSessionAndNotify() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  // Guarded so unit tests (jsdom) don't throw if dispatch is unavailable.
  if (typeof window !== "undefined" && typeof window.dispatchEvent === "function") {
    window.dispatchEvent(new Event("amanguard:unauthorized"));
  }
}

async function request(path, options = {}) {
  const { method = "GET", body, params, signal, token } = options;
  let url = `${BASE_URL}${path}`;
  if (params) {
    const query = new URLSearchParams(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== "")
    ).toString();
    if (query) url += `?${query}`;
  }

  const headers = { "Content-Type": "application/json" };
  // A replayed request (post-refresh) carries the fresh token explicitly;
  // otherwise read the current access token from storage.
  const authToken = token || localStorage.getItem(TOKEN_KEY);
  if (authToken) headers.Authorization = `Bearer ${authToken}`;

  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    signal,
  });

  // Access token expired/invalid — try to refresh transparently and replay.
  // /auth/* is exempt: a 401 there is a normal auth outcome (bad credentials,
  // or the refresh endpoint itself rejecting), surfaced to the caller instead.
  if (res.status === 401 && !path.startsWith("/auth/")) {
    // A refresh is already in flight — wait for it, then replay with the token.
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then((newToken) => request(path, { ...options, token: newToken }));
    }

    isRefreshing = true;

    try {
      const newToken = await refreshAccessToken();
      processQueue(null, newToken);
      isRefreshing = false;
      return request(path, options);
    } catch (err) {
      processQueue(err);
      isRefreshing = false;
      clearSessionAndNotify();
      throw new ApiError("Session expired", 401);
    }
  }

  if (!res.ok) {
    let message = `Request failed with status ${res.status}`;
    try {
      const data = await res.json();
      // Most errors carry `message`; the rate-limit (429) body instead has
      // messageEn/messageAr, so fall back to those before the generic string.
      message = data?.message || data?.messageEn || data?.messageAr || message;
    } catch {
      /* ignore parse errors */
    }
    throw new ApiError(message, res.status);
  }

  if (res.status === 204) return null;
  return res.json();
}

export const apiClient = {
  get: (path, opts) => request(path, { ...opts, method: "GET" }),
  post: (path, body, opts) => request(path, { ...opts, method: "POST", body }),
  put: (path, body, opts) => request(path, { ...opts, method: "PUT", body }),
  patch: (path, body, opts) => request(path, { ...opts, method: "PATCH", body }),
};

// ApiError carries a real message from the backend's JSON error body.
// Anything else (network failure, CORS, backend unreachable) is a raw
// browser error like "Failed to fetch" — not fit to show a user, so callers
// should fall back to a translated message for those instead.
export function apiErrorMessage(err, fallback) {
  return err instanceof ApiError ? err.message : fallback;
}
