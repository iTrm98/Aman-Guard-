# AmanGuard — Docker Deployment

Everything needed to run the full stack in containers lives in this folder, in two flavors:

- **Split stack** (`docker-compose.yml`, default) — nginx frontend on :3000 proxying to a separate backend on :8080. Recommended: independent scaling/rebuilds, production-shaped.
- **Monolith** (`docker-compose.monolith.yml`) — the SPA is baked into the Spring Boot jar; one `core` container serves UI + API on :8080. Simplest possible footprint (3 containers, no nginx).

Run **one at a time** — they share host ports 8080 and 3307. Each keeps its own MySQL volume.

## Quick start

```bash
cd docker
cp .env.example .env      # optional — fill in OPENAI_API_KEY etc.
docker compose up -d --build
```

(Or from the repo root: `docker compose -f docker/docker-compose.yml up -d --build`.)

| Service | URL / port | Notes |
|---|---|---|
| Frontend | http://localhost:3000 | nginx serves the SPA **and proxies `/api` + `/ws`** to the backend — same-origin, no CORS, works from any host |
| Backend | http://localhost:8080/api | published because the browser extension calls `localhost:8080` directly |
| MySQL | localhost:3307 | containers use `mysql:3306`; 3307 avoids clashing with a local MySQL |
| AI engine | *not published* | keyless/unauthenticated service — reachable only by the backend over the compose network |

Demo logins: customer `1234567890` / officer `0987654321`, password `Password123!`.

### Monolith flavor

```bash
cd docker
docker compose -f docker-compose.monolith.yml up -d --build
```

| Service | URL / port | Notes |
|---|---|---|
| App (UI + API) | http://localhost:8080 | UI at `/`, API at `/api` — same origin, no CORS, and the extension's `localhost:8080` calls work unchanged |
| MySQL | localhost:3307 | own volume (`amanguard-mono_mysql_data`), separate data from the split stack |
| AI engine | *not published* | same as the split stack |

Stop it with `docker compose -f docker-compose.monolith.yml down` before starting the split stack (shared host ports).

## Files

| File | Purpose |
|---|---|
| `docker-compose.yml` | The whole stack; build contexts point at the repo root / `backend/` / `AI/` |
| `Frontend.Dockerfile` | node:22 Vite build → nginx. Context = repo root (the build zips `extention/src` into `/extension-download`) |
| `nginx.conf` | SPA + `/api` and `/ws` reverse proxy + extension-ZIP content type |
| `Backend.Dockerfile` | Maven build → temurin-17 JRE. Context = `backend/` |
| `docker-compose.monolith.yml` | Monolith flavor: `mysql` + `ai-engine` + one `core` container |
| `Core.Dockerfile` | Monolith image: Vite build (`VITE_API_BASE_URL=/api`) → copied into `src/main/resources/static` → Maven build → temurin-17 JRE. Context = repo root. Requires the SPA-static `permitAll` block in `SecurityConfig` |
| `AI.Dockerfile` | python:3.12-slim + uvicorn on 0.0.0.0. Context = `AI/` (only `phishingGPT.py` is copied — `AI/.env` never enters the image) |
| `.env.example` | Optional overrides: `OPENAI_API_KEY`, `AMANGUARD_JWT_SECRET`, DB passwords, host ports, `VITE_API_BASE_URL` |

## Configuration

All knobs live in `docker/.env` (see `.env.example`). Highlights:

- **`OPENAI_API_KEY`** — optional. Without it the AI engine still starts and `/api/analyze` falls back to rule-based scoring (never crashes).
- **`AMANGUARD_JWT_SECRET`** — set a 64+ char secret for anything beyond a local demo.
- **`VITE_API_BASE_URL`** — baked into the bundle **at build time**. The default `/api` is same-origin (proxied by nginx), so the frontend works on any host/IP without a rebuild. Changing it requires `docker compose build frontend`.

## Day-2 commands

```bash
docker compose logs -f backend        # follow a service's logs
docker compose up -d --build backend  # rebuild one service after code changes
docker compose down                   # stop (keeps the MySQL volume)
docker compose down -v                # stop AND wipe the database
```

## Caveats

- MySQL data persists in the `amanguard_mysql_data` volume; Flyway migrations run automatically on backend startup.
- The backend health check is a TCP check (no actuator dependency, no unauthenticated GET endpoint), so "healthy" means "accepting connections", not "Flyway finished" — the first startup can take ~30–60 s.
- Requests proxied through nginx reach the backend from the nginx container's IP; the real client IP is forwarded in `X-Forwarded-For`, but the audit log / per-IP rate limiter currently read the socket address, so all proxied unauthenticated traffic shares one IP bucket. Irrelevant for authenticated traffic (rate-limited per national id).
- The repo-root `Dockerfile` / `nginx.conf` / `docker-compose.yml` are the older setup (frontend calls `localhost:8080` cross-origin). This folder supersedes them.
