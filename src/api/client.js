// Base HTTP client for talking to the AmanGuard Spring Boot backend.
// Backend base URL is configurable via VITE_API_BASE_URL (see .env.example).
//
// Auth: every request carries the stored JWT (localStorage "amanguard_token")
// as an Authorization header. A 401 on a non-auth endpoint means the session
// is gone/expired, so we clear the stored session and reload — main.jsx then
// re-reads localStorage, finds no token, and renders the login screen.

export const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api";

export const TOKEN_KEY = "amanguard_token";
export const USER_KEY = "amanguard_user";

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

function handleUnauthorized() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  // Guarded so unit tests (jsdom, no real navigation) don't throw.
  if (typeof window !== "undefined" && typeof window.location?.reload === "function") {
    try {
      window.location.reload();
    } catch {
      /* navigation not implemented in the test environment */
    }
  }
}

async function request(path, { method = "GET", body, params, signal } = {}) {
  let url = `${BASE_URL}${path}`;
  if (params) {
    const query = new URLSearchParams(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== "")
    ).toString();
    if (query) url += `?${query}`;
  }

  const headers = { "Content-Type": "application/json" };
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    signal,
  });

  // Session expired/invalid — bounce to login. /auth/* is exempt: a 401 there
  // is a normal auth outcome (bad credentials), surfaced to the caller instead.
  if (res.status === 401 && !path.startsWith("/auth/")) {
    handleUnauthorized();
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
