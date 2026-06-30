// Base HTTP client for talking to the AmanGuard Spring Boot backend.
// Backend base URL is configurable via VITE_API_BASE_URL (see .env.example).
// While the backend isn't deployed yet, set VITE_USE_MOCKS=true (default)
// so the UI keeps working with realistic mock responses.

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api";
const USE_MOCKS = import.meta.env.VITE_USE_MOCKS !== "false";

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

async function request(path, { method = "GET", body, signal } = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
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
};

export const isMockMode = () => USE_MOCKS;
