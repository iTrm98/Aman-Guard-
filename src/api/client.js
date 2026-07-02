// Base HTTP client for talking to the AmanGuard Spring Boot backend.
// Backend base URL is configurable via VITE_API_BASE_URL (see .env.example).

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api";

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = "ApiError";
    this.status = status;
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

  const res = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
    signal,
  });

  if (!res.ok) {
    let message = `Request failed with status ${res.status}`;
    try {
      const data = await res.json();
      message = data?.message || message;
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
