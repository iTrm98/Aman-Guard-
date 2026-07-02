# AmanGuard — Claude Code Project Brief

> Read this file before touching any code. It covers everything about the project: stack, architecture, patterns, and what's done vs. what's next.

---

## What Is AmanGuard?

AmanGuard is a **financial fraud prevention web app** built for the **Amad Hackathon (مسار التشريعات المالية — Financial Regulations Track)**. It's a React frontend backed by a Java Spring Boot API (`backend/`).

The app has two views that share the same shell:

1. **Customer Portal (بوابة العميل)** — A client-facing interface where users can verify bank calls, paste suspicious messages/links for analysis, view a risk report, and freeze their account in an emergency.
2. **Bank SOC Dashboard (لوحة البنك)** — An internal bank operator view showing live fraud case stats, a sortable case table, and a case detail drawer where staff can freeze accounts, escalate cases, or dismiss false positives.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 19 + Vite 8 |
| Styling | Tailwind CSS v4 (via `@tailwindcss/vite` plugin) |
| Icons | `lucide-react` |
| Language | JavaScript (JSX) — no TypeScript |
| Testing | Vitest + @testing-library/react + @testing-library/user-event |
| Font | Tajawal (Arabic primary), Inter (English fallback) — loaded from Google Fonts in `index.css` |
| Package manager | npm |
| Backend | Java 21 + Spring Boot 3, Maven, H2 in-memory DB (`backend/`) |

**There is no routing library** — view switching is done via a single `view` state in `AppShell` (`"customer"` or `"bank"`).

---

## Project Structure

```
src/
  api/
    client.js           Base HTTP client (fetch wrapper, ApiError class, query-param support)
    fraudService.js     Service functions — every one calls the real backend directly, no mock fallback

  hooks/
    useRelativeTime.js  useRelativeTime(isoString) → localized "5 minutes ago" string, re-computed every 60s

  lib/
    relativeTime.js     formatRelativeTime(isoString, lang) — pure function used by the hook

  context/
    AppContext.jsx      Single global context: theme, lang, t(), modal, panel, notifications, currentUser
    useApp.js           Re-exports useApp hook (kept separate for react-refresh compatibility)

  i18n/
    translations.js     Object T with 100+ keys, each { ar: "...", en: "..." }
    fraudPatterns.js    FRAUD_PATTERNS (officer dropdown options), FRAUD_PATTERN_MAP (ar→en for ALL
                        backend-emitted pattern strings, incl. the purchase-flow patterns
                        "عملية شراء مشبوهة" / "شراء إلكتروني محظور" / "محاولة شراء غير مصرحة"),
                        UNAUTHORIZED_PURCHASE_PATTERN_AR (stop-purchase case pattern + freeze reason),
                        displayFraudPattern(pattern, lang), riskLevelFromScore(score).
                        Single source of truth — never duplicate in components.

  components/
    layout/
      Modal.jsx               Animated modal (danger / success / info types)
      Sidebar.jsx             Dark navy sidebar with nav, notifications, settings, logout, currentUser chip
      Topbar.jsx              Header: title, search, language toggle, theme toggle, bell
      NotificationsPanel.jsx  Slide-in drawer — clickable rows (mark read + open linked case), type badges, loading skeleton, mark all read
      SettingsPanel.jsx       Slide-in drawer — theme picker + language picker + app info; when opened
                              from the bank view (App.jsx passes view prop) also shows a read-only
                              "Risk Settings" section with the max purchase limit fetched from
                              GET /config/thresholds (server-controlled, never editable)

    customer/
      AccountCard.jsx         Fetches GET /account/me — masked balance, security badges, mini stats; loading/error/retry states
      CallVerification.jsx    One-button check — no user input. GET /call-status (no params); the backend
                              looks up the current user's registered number server-side
      ScamChecker.jsx         Paste suspicious text → fraud analysis (POST /analyze)
      RiskReport.jsx          SVG gauge + findings list + interruption questions + freeze CTA
      PurchaseCheckout.jsx    "Simulate Purchase" card: merchant/amount/URL/type form →
                              POST /transactions/analyze, then gates on the response action:
                              allowed → TransactionResult green, suspended → interception
                              overlay, blocked → TransactionResult red (no override) + fires
                              onPurchaseBlocked so App.jsx injects the case into the bank
                              dashboard. NO threshold field or limit hint — the max purchase
                              amount is backend config the customer never sees.
      PurchaseInterceptionOverlay.jsx  FULL-SCREEN fixed overlay (inset:0, zIndex:70 — above the
                              modal system at 60) for medium-risk suspended purchases. Deep-red
                              blurred backdrop, pulsing Hand icon (pulseSoft), merchant/amount/
                              suspicion-reason card, "نعم، أنا" → POST /transactions/{id}/confirm
                              + success modal; "لا، أوقف العملية" → POST /transactions/{id}/cancel
                              then the App.jsx freeze flow with reason "محاولة شراء غير مصرحة"
      TransactionResult.jsx   Terminal purchase states: allowed (green, "try another") and
                              blocked (red, findings list, report number, SOC-notified note,
                              "back to home"). Blocked is final — zero customer override.

    bank/
      StatsCards.jsx          4 KPI cards with dynamic trend chips computed from backend today-vs-yesterday deltas
      CasesTable.jsx          Sortable + searchable fraud cases table; CaseRow uses useRelativeTime + displayFraudPattern
      CaseDetailPanel.jsx     Slide-in drawer: details, timeline, Freeze/Escalate/Dismiss + EDIT MODE
                              (name/pattern/score/status/notes → PUT /cases/{id}; gauge updates live while
                              typing the score; on save fires onAction("updated", updatedCase) so BankView
                              swaps the row in place). Keyed by caseId in BankView so state resets per case.
      AddCasePanel.jsx        Manual case entry drawer: national-id blur → GET /customers/{id} autofill,
                              bilingual pattern dropdown, 0-100 score, immediate action radio
                              (monitor / freeze / close), red-border validation, POST /cases on submit

  views/
    CustomerView.jsx    Assembles AccountCard + CallVerification + ScamChecker + RiskReport +
                        PurchaseCheckout (receives onPurchaseFreeze from App.jsx)
    BankView.jsx        Assembles StatsCards + CasesTable + CaseDetailPanel; error banner + retry if the fetch fails; handles XLSX export

  test/
    setup.js                @testing-library/jest-dom setup
    test-utils.jsx          renderWithApp() wraps components in AppProvider
    RiskReport.test.jsx     Component renders + freeze callback (receives the full analysis result)
    CasesTable.test.jsx     Row rendering + highlight logic
    BankView.test.jsx       Mocks fraudService + XLSX.writeFile, asserts the exported workbook contents
    fraudService.test.js    Mocks global fetch — asserts request shape and that failures throw ApiError (no fallback)
    Sidebar.test.jsx        Mobile drawer behavior
    SettingsPanel.test.jsx  Theme/language switching

  App.jsx             AppShell: owns view state, freeze flow, renders Sidebar+Topbar+views
  main.jsx            Entry point — wraps App in AppProvider
  index.css           All CSS: custom properties, dark mode, utility classes

backend/
  src/main/java/com/amanguard/backend/
    common/                          CORS config, global exception handler, ApiErrorResponse
    feature/
      account/                      GET /api/account/me — account row + stats COMPUTED from real activity
                                    (analyses today / last 30d, approved freezes)
      notifications/                GET /api/notifications, PATCH /api/notifications/{id}/read,
                                    PATCH /api/notifications/read-all — rows carry type + optional caseId
      customers/                    GET /api/customers/{nationalId} — 4 seeded demo customers (IDs
                                    1010101010 / 2020202020 / 3030303030 / 4040404040)
      callverification/             GET /api/call-status — no params; checks the current user's registered
                                    number server-side (placeholder TODO until telephony integration; BankCall
                                    rows are the future active-calls registry)
      fraudanalysis/                POST /api/analyze — real rule-based risk scoring, fully bilingual response
                                    (titleAr/En, detailAr/En, recommendationAr/En, riskLabelAr/En), persists FraudCase
      emergencyfreeze/              POST /api/freeze, PATCH /api/freeze/{id}/approve|reject — request→approval workflow
      dashboard/                    GET /api/cases/active (real COUNT/SUM stats + today-vs-yesterday deltas),
                                    GET/PUT /api/cases/{id}, POST /api/cases (manual entry: reuses
                                    EmergencyFreezeService for freeze/close actions + creates a Notification).
                                    FraudCase has nullable officer-entered columns (customerName, fraudPattern,
                                    notes, accountStatusOverride, estimatedAmount) that win over derived values.
      verification/                 POST /api/verifications/evaluate — scores the 3 interruption questions (not yet wired to the frontend)
      transactionanalysis/          Real-time purchase risk gating. POST /api/transactions/analyze runs
                                    4 sequential mock rules (first match wins, marked "TODO: replace with
                                    real AI engine" — see the Purchase verification flow section),
                                    POST /api/transactions/{id}/confirm|cancel. Blocked (high/critical)
                                    purchases auto-create a FraudCase (pattern "شراء إلكتروني محظور",
                                    estimatedAmount set) + SOC notification; critical additionally
                                    freezes via EmergencyFreezeService (request + approve) — all
                                    server-side, no customer input. Cancel creates a
                                    "محاولة شراء غير مصرحة" case and returns its caseId for the
                                    frontend freeze flow.
      config/                       GET /api/config/thresholds → { maxPurchaseAmount, currency } — echoes
                                    the amanguard.fraud.* values from application.yaml. Read-only; shown
                                    to bank officers in SettingsPanel, never a customer form field.
  src/main/resources/application.yaml   H2 in-memory DB, port 8080
  README.md                             Run instructions, DB swap notes, where a future AI engine plugs in

Every `feature/<name>/` package follows the same shape: `model/` (JPA entity), `repository/`,
`config/<Name>DataInitializer.java` (CommandLineRunner seed data), `dto/response/`, `service/` + `service/impl/`,
`controller/`. Follow this pattern for new backend features.
```

---

## Global State — AppContext

**File:** `src/context/AppContext.jsx`
**Hook:** `import { useApp } from "../context/useApp"`

Every component gets these values from `useApp()`:

```js
const {
  lang,                 // "ar" | "en"
  theme,                // "light" | "dark"
  t,                     // t("key") → translated string. t("key", { n: value }) for interpolation
  toggleTheme,          // () => void
  toggleLang,           // () => void
  notifications,        // array fetched from GET /notifications on mount, then polled every 60s
  notificationsLoading, // bool — true until the initial fetch settles
  refreshNotifications, // () => Promise — manual refetch (called e.g. after creating a case)
  markAllRead,          // () => void — optimistic local update + fire-and-forget PATCH /notifications/read-all
  markNotificationRead, // (id) => void — optimistic local update + fire-and-forget PATCH /notifications/{id}/read
  unreadCount,          // number
  modal,                // { open, title, message, type, showCancel, confirmText, onConfirm }
  showModal,            // (config) => void
  closeModal,           // () => void
  panel,                // { type: "notifications" | "settings" | null, data }
  openPanel,            // (type, data?) => void
  closePanel,           // () => void
  currentUser,          // { name, nameEn, role, accountId } — PLACEHOLDER, hardcoded until real JWT/session auth exists
} = useApp();
```

**Never use local modal state** — always go through `showModal` / `closeModal` from context.

**Never use local panel state** — always go through `openPanel` / `closePanel`.

**`currentUser` is a placeholder.** Every place that displays the logged-in user's identity (Sidebar chip, freeze-flow customer name) reads from it so swapping in real auth later is a one-line change in `AppContext.jsx`, not a repo-wide find/replace.

---

## Translations (i18n)

**File:** `src/i18n/translations.js`

All user-visible strings live here. Every key maps to `{ ar: "...", en: "..." }`.

```js
// Usage in any component:
const { t } = useApp();
t("freeze_btn")              // → "تجميد طارئ للحساب" or "Emergency Account Freeze"
t("freeze_success_msg", { n: "FR-9022" })  // → interpolates {n} in the string
```

**To add a new string:**
1. Add the key to `src/i18n/translations.js` with both `ar` and `en` values
2. Use `t("your_key")` in the component

**Never hardcode Arabic or English strings directly in JSX.** Always use `t()`.

---

## Styling System

All styling uses **CSS custom properties** defined in `src/index.css`. Never hardcode color hex values inline — use the variables.

### Color variables
```css
--bg-app          Page background
--bg-surface      Card / panel background
--bg-subtle       Input background, table alternate rows
--bg-sidebar      #101e2e (always dark, even in light mode)
--border          Standard border
--border-subtle   Lighter border (table rows, dividers)
--text-primary    Main text
--text-secondary  Subdued text
--text-muted      Placeholder / label text
--gold            #c49a5a (brand accent)
--gold-hover      #b08040
--red             #c0392b (danger / critical)
--green           #1a7a4a (success / safe)
--shadow-card     Card hover shadow
--shadow-modal    Modal drop shadow
```

Dark mode overrides all variables under `[data-theme="dark"]` — applied automatically to `document.documentElement` by AppContext.

### Utility classes (use these, don't recreate them)
```
.card              White surface with border and hover shadow
.btn-primary       Gold filled button
.btn-danger        Red filled button
.btn-ghost         Outlined button
.input-field       Styled text input / textarea
.sidebar-item      Sidebar nav button (add .active for current)
.risk-badge        Inline risk level badge (add .risk-critical / .risk-high / .risk-medium)
.status-badge      Inline account status badge (add .status-active / .status-frozen / .status-partial)
.live-dot          Pulsing green dot
.panel-overlay     Dark overlay behind slide-in drawers
.panel-drawer      The slide-in drawer itself (RTL/LTR aware)
.animate-fade-in   Fade in + slide up on mount
.animate-slide-up  Slightly larger slide up
.animate-slide-in  Slide in from the side
```

The `pulseSoft` keyframe animation (`animation: pulseSoft 1.5s ease-in-out infinite`) is the standard loading-skeleton treatment — used in `StatsCards`, `AccountCard`, and `NotificationsPanel`.

---

## API Layer

**Files:** `src/api/fraudService.js`, `src/api/client.js`

There is **no mock mode**. Every function in `fraudService.js` calls the real backend and lets errors propagate as `ApiError` (thrown from `client.js`, carrying `.message` from the backend's JSON error body and `.status`). Components own their own loading/error/retry state — see `AccountCard.jsx` and `BankView.jsx` for the pattern.

### Backend endpoints
| Function | Method | Endpoint | Used by |
|---|---|---|---|
| `getAccountInfo()` | GET | `/account/me` | AccountCard |
| `checkCallStatus()` | GET | `/call-status` | CallVerification |
| `analyzeText(text)` | POST | `/analyze` | ScamChecker |
| `freezeAccount({caseId, reason})` | POST | `/freeze` | App.jsx customer freeze flow |
| `approveFreezeRequest(requestId)` | PATCH | `/freeze/{id}/approve` | freezeCaseByStaff |
| `freezeCaseByStaff({caseId, freezeRequestId, freezeStatus, reason})` | POST + PATCH | `/freeze` then `/freeze/{id}/approve` | CaseDetailPanel "Freeze & Call" |
| `getActiveCases()` | GET | `/cases/active` | BankView |
| `getCaseById(caseId)` | GET | `/cases/{id}` | BankView (open case from a notification) |
| `createCase(body)` | POST | `/cases` | AddCasePanel |
| `updateCase(caseId, body)` | PUT | `/cases/{id}` | CaseDetailPanel edit mode |
| `getCustomerByNationalId(id)` | GET | `/customers/{nationalId}` | AddCasePanel autofill on blur |
| `getNotifications()` | GET | `/notifications` | AppContext (mount + 60s polling) |
| `markNotificationRead(id)` | PATCH | `/notifications/{id}/read` | AppContext (notification row click) |
| `markAllNotificationsRead()` | PATCH | `/notifications/read-all` | AppContext markAllRead |
| `analyzeTransaction(body)` | POST | `/transactions/analyze` | PurchaseCheckout |
| `confirmTransaction(id)` | POST | `/transactions/{id}/confirm` | PurchaseInterceptionOverlay |
| `cancelTransaction(id)` | POST | `/transactions/{id}/cancel` | PurchaseInterceptionOverlay |
| `getThresholds()` | GET | `/config/thresholds` | SettingsPanel (bank view only) |

### Response shapes
```js
// getAccountInfo → {
//   iban, maskedIban, balance, currency, status, securityStatus,
//   stats: { opsToday, securityChecks, threatsStopped }
// }

// checkCallStatus → { hasActiveOfficialCall: bool, message: string }
// Call verification takes NO user input: GET /call-status has no parameters.
// The backend resolves the current user's registered phone number itself and
// checks it against the active-calls registry (server-side lookup only).

// analyzeText → {
//   riskScore: number (0-100),
//   riskLevel: "critical" | "high" | "medium" | "low",
//   riskLabelAr, riskLabelEn,
//   findings: [{ titleAr, titleEn, detailAr, detailEn }],
//   recommendationAr, recommendationEn,
//   interruptionQuestions: [{ id, text }],   // Arabic-only (not yet bilingual)
//   caseId: number | null   // real, persisted FraudCase id — used to freeze
// }
// Components pick the language field via `lang === "en" && en ? en : ar` —
// English falls back to Arabic, never undefined.

// freezeAccount / freezeCaseByStaff / approveFreezeRequest → {
//   requestId, success, reportNumber,
//   status: "pending" | "approved" | "rejected",
//   message,
// }

// getActiveCases → {
//   stats: {
//     criticalToday, suspectedCases, accountsFrozen, amountSaved,   // real COUNT/SUM queries
//     criticalDelta, suspectedDelta, frozenDelta, amountSavedToday, // today-vs-yesterday, drive StatsCards trend chips
//   },
//   cases: [{
//     id, caseId, createdAt,   // createdAt is ISO-8601 — format it client-side with useRelativeTime / formatRelativeTime
//     customerName, fraudPattern, riskScore, riskLevel, accountStatus, notes,
//     freezeRequestId, freezeStatus,
//   }]
// }
// getCaseById / createCase / updateCase all return one case in this same row shape.

// getCustomerByNationalId → { name, nameEn, accountNumber, phone, customerId }

// getNotifications → [{ id, read, icon, titleAr, titleEn, bodyAr, bodyEn,
//                       type: "freeze"|"analysis"|"warning", caseId: number|null, createdAt }]
// Clicking a notification marks it read; if caseId is set it also opens that
// case's detail drawer in the bank view (bridge lives in App.jsx).

// analyzeTransaction → {
//   transactionId,
//   riskScore, riskLevel: "low"|"medium"|"high"|"critical",
//   riskLabelAr, riskLabelEn,
//   action: "allowed" | "suspended" | "blocked",
//   findings: [{ titleAr, titleEn, detailAr, detailEn }],
//   recommendationAr, recommendationEn,
//   reportNumber,   // set only when blocked (freeze report number for critical,
//                   // FR-{9000+caseId} for high), null otherwise
// }

// confirmTransaction / cancelTransaction → { success, message, caseId }
// caseId is null on confirm; on cancel it's the freshly created
// "محاولة شراء غير مصرحة" fraud case, which the frontend passes to the
// existing freeze flow (POST /freeze requires a caseId).

// getThresholds → { maxPurchaseAmount: number, currency: string }
// Mirrors amanguard.fraud.* in backend application.yaml. Read-only in the UI.
```

### Purchase verification flow (real-time AI risk gating)
`PurchaseCheckout` posts the purchase to `/transactions/analyze`; the backend evaluates **4
sequential mock rules (first match wins)** and the UI gates on the result. Only **suspended**
transactions accept a customer decision — confirm and cancel reject anything else server-side,
so blocked purchases have zero override ability.

| Rule | Condition | Score | Level | Action |
|---|---|---|---|---|
| 1 | amount > configured max (`amanguard.fraud.max-purchase-amount`, default 5000) | 95 | `critical` | `blocked` — auto FraudCase + **immediate server-side account freeze** + SOC notification |
| 2 | merchant URL contains suspicious keywords (fake, phish, scam, secure-login, verify-account, free-gift, prize) | 82 | `high` | `blocked` — auto FraudCase + SOC notification |
| 3 | merchant not in the known-merchants whitelist (amazon, noon, jarir, extra, stc, zain, mobily, apple, google, microsoft, samsung + Arabic aliases) | 55 | `medium` | `suspended` — full-screen `PurchaseInterceptionOverlay`, customer approves or stops |
| 4 | everything else | 15 | `low` | `allowed` — green confirmation |

**The max-purchase threshold is backend configuration only** — set in
`backend/src/main/resources/application.yaml` under `amanguard.fraud.max-purchase-amount`
(with `amanguard.fraud.currency`), injected via `@Value`. It must never appear as a customer
form field or hint; the customer only sees the outcome. Bank officers can see it read-only in
SettingsPanel (fetched from `GET /api/config/thresholds`, never hardcoded).

For blocked results, `App.jsx#handlePurchaseBlocked` injects the case into the bank dashboard
(same `frozenCase` prop-injection as manual freezes; `accountStatus: "frozen"` for critical,
`"active"` for high) — the freeze itself already happened server-side inside `/analyze`, so the
frontend never calls `/freeze` for blocked purchases. Auto-created cases also appear via the
existing 60-second notification/dashboard polling.

### `/analyze` is real, rule-based analysis — not an ML model
`FraudAnalysisServiceImpl` (backend) does deterministic keyword matching (OTP requests, urgency phrasing, suspicious links, remote-access-tool mentions, etc.) to compute `riskScore`/`findings`. It's genuine server-side computation, not a stub — but it's not a trained model either. A future Python AI engine would replace/augment this scoring; see `backend/README.md` for where that would plug in. The response contract wouldn't need to change, so no frontend work would be required when that happens.

---

## Key Patterns & Conventions

### Adding a new component
1. Create in the right folder (`components/customer/`, `components/bank/`, `components/layout/`)
2. Import `useApp` from `../../context/useApp`
3. Use `t("key")` for all strings — add keys to `translations.js` if needed
4. Use CSS variables for all colors — no hardcoded hex
5. Use existing utility classes (`.card`, `.btn-primary`, etc.) — don't reinvent them

### Adding a new modal
```js
const { showModal, t } = useApp();
showModal({
  title:       t("your_title_key"),
  message:     t("your_message_key"),
  type:        "danger",   // "danger" | "success" | "info"
  showCancel:  true,
  confirmText: t("your_confirm_key"),
  onConfirm:   () => { /* action */ },
});
```

### Adding a new slide-in panel
1. Create component using `.panel-overlay` + `.panel-drawer` classes
2. Register type in `AppContext.jsx` (it's a free string — just use `openPanel("your_type")`)
3. Render it conditionally in `App.jsx` alongside the existing panels

### Calling a hook once per list item
You can't call a hook (like `useRelativeTime`) directly inside a `.map()` callback in the parent's render body — extract a small subcomponent per row instead. See `CaseRow` in `CasesTable.jsx` and `NotificationRow` in `NotificationsPanel.jsx` for the pattern.

### RTL/LTR awareness
- `dir` is set on `document.documentElement` by AppContext on language switch
- Use `insetInlineStart` / `insetInlineEnd` instead of `left` / `right` in inline styles for RTL-aware positioning
- Use `paddingInlineStart` / `paddingInlineEnd` instead of `paddingLeft` / `paddingRight`

### Adding a new backend feature
Follow the existing `feature/<name>/` package convention (see Project Structure above) — `model/`, `repository/`, `config/<Name>DataInitializer.java`, `dto/response/`, `service/` + `service/impl/`, `controller/`. `feature/callverification` is the simplest complete example to copy from.

---

## Running the Project

```bash
# Frontend
npm install          # Install dependencies
cp .env.example .env # Create local env file (VITE_API_BASE_URL)
npm run dev          # Dev server → http://localhost:5173
npm run build        # Production build
npm run lint         # ESLint check
npm test             # Run the Vitest suite

# Backend (from backend/)
./mvnw spring-boot:run   # → http://localhost:8080/api, H2 in-memory DB
```

The frontend expects the backend running at `VITE_API_BASE_URL` (default `http://localhost:8080/api`) — there's no mock fallback, so components will show their error/retry states if it's down. See `backend/README.md` for backend-specific setup (DB swap, AI engine integration point).

---

## What's Done ✅

- Full customer portal (one-button call verify — no user input, server-side lookup via GET /api/call-status — fraud text analysis, risk report, emergency freeze)
- Full bank SOC dashboard (stats, case table with live relative timestamps, case detail drawer with actions)
- Backend fully wired end-to-end — no mock/fallback layer; every screen fetches real data and has loading/error/retry states
- Freeze request → bank-approval workflow (customer-initiated freezes are PENDING until staff approve; staff-initiated freezes approve immediately)
- Dark / light theme toggle
- Arabic / English language toggle (full RTL/LTR swap)
- Notifications panel (fetched from backend, slide-in, loading skeleton, mark-all-read)
- Settings panel (theme + language pickers)
- Sign out confirmation
- XLSX export of cases
- Real-time purchase verification with AI risk gating (PurchaseCheckout → analyze → allow /
  full-screen interception overlay / auto-block, with auto-created SOC cases + notifications;
  scoring is a placeholder rule engine marked `TODO: replace with real AI engine`)
- `currentUser` placeholder in AppContext (see Global State section)
- Full Vitest suite, mocking the network layer directly (no ambient backend dependency)
- Correct financial-domain Arabic translations throughout

## What's NOT Done Yet ❌

- **Authentication** — No login screen or JWT handling. `App.jsx` renders directly without an auth guard, and `currentUser` in `AppContext.jsx` is a hardcoded placeholder.
- **Real AI model** — `/analyze` is deterministic rule-based scoring (see API Layer above), not a trained ML model. A Python AI engine is future work.
- **WebSockets** — MVP spec mentions real-time case updates (INT-002) for when a customer freezes their account. Currently simulated by prop injection (`App.jsx` → `BankView`'s `injectedCase`).
- **Responsive / mobile layout** — Designed for desktop (1080px+). Sidebar collapses on narrow screens are not yet implemented.
- **Real search in Topbar** — The search input in the header has no handler yet.
- **Pagination** — Cases table shows the 20 most recent cases with no pagination.
- **Bilingual interruption questions** — analysis findings/recommendations/labels are bilingual, but the 3 interruption questions are still Arabic-only.
- **Interruption-questions submission** — `RiskReport`'s 3 checkboxes are local UI state only; the backend has a matching `POST /verifications/evaluate` endpoint but nothing calls it yet.

---

## Git

- Repo: `https://github.com/ep2wq/Aman-Guard-.git`
- Branch: `main`
- All commits by Claude use `ep2wq` as author
