# AmanGuard 🛡️

**Proactive financial fraud prevention platform** — built for the **Amad Hackathon (مسار التشريعات المالية — Financial Regulations Track)**.

AmanGuard protects bank customers *before* the money leaves the account. Instead of reporting fraud after the fact, it verifies bank calls in real time, analyzes suspicious messages with AI, gates risky purchases the moment they happen, guards checkout on **any website** through a browser extension, and gives both the customer and the bank's Security Operations Center (SOC) the tools to stop an attack in seconds.

> **أمان جارد: نوقف الاحتيال المالي قبل أن يبدأ — حماية استباقية للعميل والبنك في منصة واحدة.**
>
> **AmanGuard: stopping financial fraud before it starts — proactive protection for the customer and the bank in one platform.**

---

## Screenshots

> Add screenshots here before the hackathon presentation

**Demo video:** [▶️ Watch the project walkthrough](https://drive.google.com/file/d/1_FFxq7MaQK564Yu2h_aqJZX4F978thZI/view?usp=sharing)

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19, Vite 8, Tailwind CSS v4, lucide-react (icons), xlsx (Excel export), Vitest + Testing Library |
| **Backend** | Java 17, Spring Boot 3.5, Spring Security + JWT, Bucket4j (rate limiting), MySQL 8 + Flyway migrations, Maven |
| **AI Engine** | Python, FastAPI, uvicorn, OpenAI API |
| **Browser Extension** | Chrome Extension MV3, Shadow DOM, Service Worker, chrome.storage |
| **Languages** | JavaScript (JSX), Java, Python, CSS |

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    AmanGuard System                      │
├─────────────────────────────────────────────────────────┤
│  Chrome Extension (extention/src/)                       │
│  ├── content.js — intercepts payment forms               │
│  ├── background.js — AI analysis + SOC reporting         │
│  └── popup.html — connection status + last scan          │
├─────────────────────────────────────────────────────────┤
│  React Frontend (port 5173)                              │
│  ├── Customer Portal (6 pages with sidebar nav)          │
│  └── Bank SOC Dashboard + Audit Log                      │
├─────────────────────────────────────────────────────────┤
│  Spring Boot Backend (port 8080)                         │
│  ├── JWT Authentication + Role-based access              │
│  ├── Rate Limiting (Bucket4j)                            │
│  ├── Fraud Analysis (rule-based + AI engine)             │
│  ├── Real-time Purchase Protection                       │
│  ├── Emergency Freeze Workflow                           │
│  ├── Audit Log (append-only, Saudi timezone)             │
│  └── MySQL + Flyway migrations                           │
├─────────────────────────────────────────────────────────┤
│  Python AI Engine (port 8000)                            │
│  ├── FastAPI + uvicorn                                   │
│  ├── POST /analyze-message                               │
│  └── OpenAI API integration (Arabic + English NLP)       │
├─────────────────────────────────────────────────────────┤
│  MySQL Database (port 3306)                              │
│  └── amanguard_db (Flyway migrations V1–V6)              │
└─────────────────────────────────────────────────────────┘
```

The frontend never talks to the AI engine directly — the backend calls it for message analysis and **falls back to deterministic rule-based scoring automatically** if the engine is down, so the platform keeps working end-to-end without it. The browser extension talks to the backend for SOC reporting and connects to the web app through a same-origin `postMessage` bridge (no hardcoded extension ID).

---

## Features

### Customer Portal

- **Overview dashboard** — account card, quick actions, the extension install/status card, and latest unread notifications
- **Bank call verification** — one click, no input needed; the backend checks the customer's registered number server-side
- **AI message scanner** — paste any suspicious message or link, get a risk gauge, detected fraud indicators, mandatory verification questions, and a bilingual recommendation (analysis source shown as "AI" or "rule-based")
- **Real-time purchase protection** — every simulated purchase is risk-gated into three tiers: **allowed** (green confirmation), **suspended** (full-screen security interception where the customer approves or stops the payment), or **blocked** (final, no customer override; the SOC is notified and critical cases are frozen server-side instantly)
- **My Account page** — masked balance, account details, activity and security status
- **Emergency freeze** — dedicated page with a clear explanation of what gets stopped; customer freeze requests enter a bank-approval workflow and produce an official report number

### Bank SOC Dashboard

- **Live fraud cases table** — sortable, searchable, auto-refreshing, with relative timestamps and row highlighting for incoming cases
- **KPI stats cards** — critical cases, monitored cases, frozen accounts, protected amounts, each with today-vs-yesterday trend deltas computed from real data
- **Case detail drawer** — full case view with timeline and staff actions: freeze & contact, escalate, dismiss (false positive), and inline editing
- **Manual case entry** — national-ID lookup autofills the customer, bilingual fraud-pattern dropdown, immediate action selection
- **Audit log page** — server-paged, filterable audit trail (Saudi-day date range, action category, user/IP search) with Saudi-timezone timestamps and a two-sheet XLSX export
- **XLSX export** — one-click Excel report with Arabic column headers and auto-fit columns
- **Notifications** — per-user scoped, with click-through that opens the linked case

### System-wide

- **JWT authentication** with strict role-based access (CUSTOMER / BANK_OFFICER) — each role only ever sees its own view, enforced in both UI and API
- **Full Arabic / English bilingual support** with complete RTL/LTR layout switching
- **Dark / light theme**
- **Mobile-responsive layout** — sidebar drawer, reflowed tables, touch-friendly targets
- **Per-endpoint rate limiting** per user/IP with localized 429 responses
- **Audit logging** of requests on the backend
- **AI engine with automatic rule-based fallback** — the demo never breaks if OpenAI is unreachable
- **Browser extension** with real-time payment interception on any website
- **Automatic extension ↔ app connection** via `postMessage` (no extension ID needed)
- **Extension popup** showing connection status, user info, and last scan result
- **Download the extension** directly from the customer portal
- **Enable / disable** extension protection from within the app

---

## Browser Extension

AmanGuard includes a Chrome/Edge browser extension that provides real-time payment protection on any website.

### Features
- 🛡️ Intercepts payment forms before submission
- 🤖 Analyzes the payment gateway URL via the AI engine
- ⚠️ Shows a branded AmanGuard overlay with risk score and findings
- ❌ Blocks critical threats automatically (fake domains, suspicious TLDs, HTTP payment pages)
- ✅ Clears safe transactions with a 10-second countdown
- 🔗 Connects automatically to your AmanGuard account via postMessage (no manual setup)
- 👤 Shows logged-in user name and connection status in overlay and popup
- 📊 Reports High/Critical transactions to the SOC dashboard automatically

The overlay and popup match the AmanGuard web-app brand system — same colors, Tajawal font, card / button / badge styling, and risk gauge.

### Detection Rules
The extension triggers when it detects card-payment fields (card number / CVV / saved-payment tokens) on a page, then scores the destination gateway:

| Rule | Trigger | Risk Level |
|---|---|---|
| Cross-domain form hijacking | Form submits to a different domain | Critical |
| New / unverifiable domain | Very new or unknown registration age | High |
| Known brand typosquatting | amaz0n, paypa1, etc. | Critical |
| Suspicious TLD | .ru, .tk, .xyz, .pw, .cc | High |
| Unencrypted connection | HTTP (not HTTPS) payment page | High |

### Installation
1. Clone the repo or download the extension files
2. Open `chrome://extensions` in Chrome or Edge
3. Enable **Developer Mode**
4. Click **Load unpacked** → select the `extention/src` folder
5. Sign in to AmanGuard at `http://localhost:5173` — extension connects automatically

### Download from the App
Once logged in, go to **Overview** → **إضافة الحماية** card → click **تحميل الإضافة** to download a ZIP of the extension files directly from the app.

---

## Getting Started

### Prerequisites

```
- Node.js 18+
- Java 17+
- Python 3.9+
- MySQL 8+ (running on port 3306)
```

### 1. Database setup

```sql
CREATE DATABASE amanguard_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'amanguard_user'@'localhost' IDENTIFIED BY 'AmanGuard@12345';
GRANT ALL PRIVILEGES ON amanguard_db.* TO 'amanguard_user'@'localhost';
FLUSH PRIVILEGES;
```

### 2. AI Engine (optional — the backend falls back to rule-based scoring without it)

```bash
cd AI
pip install fastapi uvicorn openai python-dotenv
# Add OPENAI_API_KEY=your-key to AI/.env
python phishingGPT.py
# Runs on http://localhost:8000
```

### 3. Backend

```bash
cd backend
.\mvnw.cmd spring-boot:run   # Windows
./mvnw spring-boot:run       # Mac/Linux
# Runs on http://localhost:8080
# Flyway auto-creates all tables and seeds demo data on first start
```

### 4. Frontend

```bash
npm install
# Create .env with: VITE_API_BASE_URL=http://localhost:8080/api
npm run dev
# Runs on http://localhost:5173
```

### 5. Browser Extension (optional)

```
Open chrome://extensions → enable Developer Mode → Load unpacked → select extention/src
Then sign in at http://localhost:5173 — the extension connects automatically.
```

---

## Demo Credentials

```
Customer Account:
  National ID: 1234567890
  Password:    Password123!

Bank Officer Account:
  National ID: 0987654321
  Password:    Password123!
```

---

## API Endpoints Reference

| Method | Endpoint | Role | Description |
|---|---|---|---|
| POST | `/api/auth/login` | Public | JWT login (national ID + password) |
| POST | `/api/auth/refresh` | Public | Exchange a refresh token for a new access token |
| POST | `/api/auth/logout` | Public | Blacklist the access token |
| GET | `/api/account/me` | CUSTOMER | Account info + computed stats |
| GET | `/api/call-status` | Authenticated | Verify an active official bank call |
| POST | `/api/analyze` | Authenticated | Fraud text analysis (AI + fallback) |
| POST | `/api/freeze` | Authenticated | File an emergency freeze request |
| PATCH | `/api/freeze/{id}/approve` | BANK_OFFICER | Approve a freeze request |
| PATCH | `/api/freeze/{id}/reject` | BANK_OFFICER | Reject a freeze request |
| POST | `/api/transactions/analyze` | CUSTOMER | Purchase risk check (allow/suspend/block) |
| POST | `/api/transactions/{id}/confirm` | CUSTOMER | Confirm a suspended purchase |
| POST | `/api/transactions/{id}/cancel` | CUSTOMER | Stop a suspicious purchase |
| GET | `/api/cases/active` | BANK_OFFICER | Live cases + dashboard stats |
| GET | `/api/cases/{id}` | BANK_OFFICER | Single case detail |
| POST | `/api/cases` | BANK_OFFICER | Manual case entry |
| PUT | `/api/cases/{id}` | BANK_OFFICER | Update a case |
| GET | `/api/customers/{nationalId}` | BANK_OFFICER | Customer lookup (autofill) |
| GET | `/api/notifications` | Authenticated | Per-user notifications |
| PATCH | `/api/notifications/{id}/read` | Authenticated | Mark one notification read |
| PATCH | `/api/notifications/read-all` | Authenticated | Mark all notifications read |
| GET | `/api/audit-logs` | BANK_OFFICER | Paged, filterable audit trail |
| GET | `/api/config/thresholds` | BANK_OFFICER | Read-only risk thresholds |

"Authenticated" = any signed-in role; per-user data (account, notifications) is additionally scoped inside the service layer. The extension serves at `GET /extension-download` (a ZIP built by a Vite plugin) — a frontend endpoint, not part of the backend API.

---

## Rate Limits

```
POST /api/analyze              → 30 requests/minute per user
POST /api/auth/login           → 5 requests/minute per IP
POST /api/transactions/analyze → 20 requests/minute per user
POST /api/freeze               → 10 requests/minute per user
All other endpoints            → 100 requests/minute per user
```

Exceeding a limit returns **HTTP 429** with `Retry-After` and a bilingual error message, surfaced inline in the UI.

---

## Security

- JWT access tokens expire after **30 minutes**, refresh tokens after **7 days**; the frontend refreshes access tokens silently in the background. The JWT secret is configurable via the `AMANGUARD_JWT_SECRET` environment variable
- All passwords hashed with **BCrypt**
- Role-based endpoint protection (Spring Security) — customer and officer surfaces are fully separated
- Rate limiting via **Bucket4j** (in-memory, keyed per user, falling back to client IP)
- The OpenAI API key lives **only** in the Python engine's `.env` — never referenced in Java code, responses, or logs
- Analyzed message content is **never logged** — failures log metadata only (user ID + text length)
- The extension stores its session token only in `chrome.storage.local` and never logs tokens or user data
- Request audit trail persisted by a backend interceptor, queryable by bank officers
- Per-user notification scoping — users can never read or modify another user's notifications

---

## Project Structure

```
Aman-Guard/
├── extention/              # Chrome/Edge browser extension
│   └── src/
│       ├── manifest.json   # MV3, externally_connectable
│       ├── background.js   # Service worker: AI calls, SOC reporting, token storage
│       ├── content.js      # Payment interception, Shadow DOM overlay
│       ├── overlay.css     # AmanGuard branded overlay styles (canonical copy)
│       ├── popup.html      # Toolbar popup UI
│       └── popup.js        # Popup logic
├── src/                    # React frontend
│   ├── api/                # HTTP client + service functions
│   ├── components/         # Reusable UI components (layout / customer / bank)
│   ├── context/            # AppContext (theme, lang, auth, modals, notifications)
│   ├── data/               # Static data (customer/bank page config)
│   ├── hooks/              # useRelativeTime
│   ├── i18n/               # Translations + fraud pattern maps
│   ├── views/              # Page-level views (LoginView, CustomerView, BankView)
│   │   └── customer/       # 6 customer sub-pages
│   └── test/               # Vitest test suite
├── backend/                # Spring Boot backend
│   └── src/main/java/com/amanguard/backend/
│       ├── feature/        # Feature packages (auth, cases, freeze, transactions, audit, ...)
│       ├── common/         # CORS, exception handling, rate limiting, security helpers
│       └── security/       # JWT filter + SecurityConfig
├── AI/                     # Python AI engine (phishingGPT.py — FastAPI + OpenAI)
├── public/                 # Static assets + extension download page
└── README.md
```

---

## Running Tests

```bash
# Frontend tests (Vitest + Testing Library — mocks the network layer)
npm test

# Backend tests
cd backend && .\mvnw.cmd test    # Windows
cd backend && ./mvnw test        # Mac/Linux
```

---

## What's Done

- ✅ JWT authentication with role-based access (CUSTOMER / BANK_OFFICER)
- ✅ JWT silent refresh (7-day refresh token)
- ✅ Customer portal multi-page navigation (6 pages)
- ✅ Bank SOC multi-page navigation (Dashboard + Cases + Audit Log)
- ✅ AI message analysis with automatic rule-based fallback
- ✅ Real-time purchase protection (allow / suspend / block)
- ✅ Emergency freeze request → bank-approval workflow
- ✅ Audit log page with Excel export (Saudi timezone)
- ✅ Per-endpoint rate limiting and per-user data scoping
- ✅ Full Arabic/English bilingual UI with RTL/LTR and dark/light themes
- ✅ Browser extension with branded AmanGuard UI
- ✅ Automatic token sharing (postMessage bridge)
- ✅ Extension popup with connection status and last scan
- ✅ Download extension from customer portal
- ✅ Enable/disable extension from app

---

## Alignment with SAMA Regulations

- **Audit trail** — backend interceptor persists a request audit log for sensitive operations, viewable and exportable by bank officers
- **Role-based access control (RBAC)** — CUSTOMER and BANK_OFFICER separated at both UI and API layers
- **Account freeze workflow with approval chain** — customer requests are pending until a bank officer approves; critical fraud triggers immediate server-side freezing
- **Rate limiting** — per-user/per-IP quotas guard against automated abuse
- **Data isolation** — account data and notifications are scoped to the authenticated user
- **No sensitive content in logs** — analyzed messages and API keys never appear in logs; only metadata (user ID, text length) is recorded
