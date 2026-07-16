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
| Backend | Java 17 + Spring Boot 3.5, Maven, MySQL + Flyway migrations, Spring Security + JWT, Bucket4j rate limiting (`backend/`) |

**There is no routing library** — view switching is done via a single `view` state in `AppShell` (`"customer"` or `"bank"`).

---

## Project Structure

```
src/
  api/
    client.js           Base HTTP client (fetch wrapper, ApiError class, query params). Attaches the
                        stored JWT access token (localStorage "amanguard_token") as a Bearer header on
                        every request. On a 401 on a non-/auth endpoint it transparently refreshes: it
                        POSTs the stored refresh token ("amanguard_refresh_token") to /auth/refresh,
                        stores the new token(s), and replays the original request — invisible to the
                        user, no reload. A single-flight guard (isRefreshing + failedQueue/processQueue)
                        makes concurrent 401s share ONE refresh call and replay once it resolves. Only if
                        the refresh itself fails (refresh token missing/expired/invalid) does it clear all
                        three storage keys and dispatch a window "amanguard:unauthorized" event → AppContext
                        drops to the login screen. Exports BASE_URL, TOKEN_KEY, REFRESH_TOKEN_KEY, USER_KEY.
    fraudService.js     Service functions — every one calls the real backend directly, no mock fallback.
                        Also holds login(nationalId, password) and logout() (POST /auth/login, /auth/logout).

  data/
    customerPages.js    CUSTOMER_PAGES — id, emoji icon, bilingual label/desc, and search keywords for the
                        6 customer portal pages (overview / call-verify / scam-check / purchase-protect /
                        account / emergency-freeze). Single source of truth for the Sidebar sub-nav, the
                        Topbar page title, and SearchDropdown results. Page components themselves use the
                        page_* translation keys via t(), not this file.
    bankPages.js        BANK_PAGES — id, emoji icon, bilingual label for the 3 SOC pages (dashboard /
                        cases / audit-log). Feeds the Sidebar officer sub-nav; BankView routes on the id.

  hooks/
    useRelativeTime.js  useRelativeTime(isoString) → localized "5 minutes ago" string, re-computed every 60s

  lib/
    relativeTime.js     formatRelativeTime(isoString, lang) — pure function used by the hook

  context/
    AppContext.jsx      Single global context: theme, lang, t(), modal, panel, notifications, and auth
                        (currentUser, isAuthenticated, completeLogin, logout). Auth state is seeded from
                        localStorage so a reload restores the session; notifications only poll once authed.
    useApp.js           Re-exports useApp hook (kept separate for react-refresh compatibility)

  i18n/
    translations.js     Object T with 100+ keys, each { ar: "...", en: "..." }
    fraudPatterns.js    FRAUD_PATTERNS (officer dropdown options). FRAUD_PATTERN_MAP — single source of
                        truth mapping every stored fraud_pattern value to a bilingual { ar, en } label.
                        Covers BOTH shapes the backend stores: UPPER_SNAKE_CASE keys (the V2 seed data —
                        e.g. "BANK_SUPPORT_OTP" / "OTP_REQUEST_BANK_IMPERSONATION" — plus defensive
                        generic keys) AND runtime Arabic strings (detectFraudPattern output, the
                        purchase-flow patterns "عملية شراء مشبوهة" / "شراء إلكتروني محظور" /
                        "محاولة شراء غير مصرحة", manual officer entry). displayFraudPattern(pattern, lang)
                        returns entry.ar/entry.en, else Title-cases an unmapped snake_case key — it never
                        shows a raw key. UNAUTHORIZED_PURCHASE_PATTERN_AR / BLOCKED_PURCHASE_PATTERN_AR,
                        riskLevelFromScore(score). Never duplicate in components (CasesTable,
                        CaseDetailPanel, AddCasePanel, and the BankView XLSX export all route through it).

  components/
    layout/
      Modal.jsx               Animated modal (danger / success / info types)
      Sidebar.jsx             Dark navy sidebar with nav, notifications, settings, logout, currentUser chip.
                              Responsive via isOpen/isMobile/onClose props (from App, inline styles — no
                              Tailwind md: classes): desktop collapses to a 60px icon rail when isOpen is
                              false; mobile renders a fixed overlay drawer (80vw/max 280px) that slides
                              off-screen (RTL-aware translateX) when closed. The mobile backdrop lives in App.jsx.
                              Renders a per-role sub-nav under the main nav item from one generalized block:
                              CUSTOMER → CUSTOMER_PAGES (customerPage/onCustomerPageChange), BANK_OFFICER →
                              BANK_PAGES (bankPage/onBankPageChange). Expanded → emoji + label rows (13px,
                              ≥44px tap height on mobile), collapsed desktop rail → icon-only with tooltip;
                              the active page row has a var(--gold) background. Rows call the App.jsx navigate
                              handlers, which also close the mobile drawer
      Topbar.jsx              Header: title, search, language toggle, theme toggle, bell. The search input
                              is a controlled component: value={searchQuery} + onChange → onSearch(raw value),
                              both props from App.jsx (AppShell). Topbar never debounces or filters itself.
                              Customer view: title/subtitle show the ACTIVE portal page (customerPage prop
                              looked up in CUSTOMER_PAGES, bilingual) and a non-empty query renders
                              SearchDropdown; bank view keeps the generic title + cases-filter search
      SearchDropdown.jsx      Customer-portal search results anchored under the topbar input: filters
                              CUSTOMER_PAGES by keywords/labels/descs; row click → onNavigate(page.id), then
                              Topbar clears the query which closes the dropdown. Desktop: absolute 300px
                              panel; mobile: fixed full-width minus 32px, 60vh max height, ≥56px rows
      PageHeader.jsx          Shared customer page header (emoji icon + t(titleKey) + t(descKey) + isMobile).
                              Mobile sizing: icon/title via the .page-header-* media-query classes in
                              index.css; description font + bottom margin via the isMobile prop
      NotificationsPanel.jsx  Slide-in drawer — clickable rows (mark read + open linked case), type badges, loading skeleton, mark all read
      SettingsPanel.jsx       Slide-in drawer — theme picker + language picker + app info; when opened
                              from the bank view (App.jsx passes view prop) also shows a read-only
                              "Risk Settings" section with the max purchase limit fetched from
                              GET /config/thresholds (server-controlled, never editable)

    customer/
      AccountCard.jsx         Fetches GET /account/me — masked balance, security badges, mini stats; loading/error/retry states
      CallVerification.jsx    One-button check — no user input. GET /call-status (no params); the backend
                              looks up the current user's registered number server-side
      ScamChecker.jsx         Paste suspicious text → fraud analysis (POST /analyze); optional isMobile prop
                              shrinks the textarea to 3 rows on phones
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
      CasesTable.jsx          Sortable + searchable fraud cases table; CaseRow uses useRelativeTime + displayFraudPattern.
                              Accepts externalSearch (topbar search, via BankView): when non-empty it overrides
                              the local search input (externalSearch || query) and resets it on change; when
                              empty the local input filters independently. Search miss → no_search_results row,
                              empty table → no_cases
      CaseDetailPanel.jsx     Slide-in drawer: details, timeline, Freeze/Escalate/Dismiss + EDIT MODE
                              (name/pattern/score/status/notes → PUT /cases/{id}; gauge updates live while
                              typing the score; on save fires onAction("updated", updatedCase) so BankView
                              swaps the row in place). Keyed by caseId in BankView so state resets per case.
      AddCasePanel.jsx        Manual case entry drawer: national-id blur → GET /customers/{id} autofill,
                              bilingual pattern dropdown, 0-100 score, immediate action radio
                              (monitor / freeze / close), red-border validation, POST /cases on submit

  views/
    LoginView.jsx       Full-screen national-id + password login (login() → POST /auth/login), bilingual,
                        with a collapsible demo-credentials panel. On success calls completeLogin; App.jsx
                        renders this instead of the shell whenever isAuthenticated is false.
    CustomerView.jsx    PURE PAGE ROUTER for the customer portal: maps the customerPage prop (App.jsx state)
                        to one of the six views/customer/ pages and threads isMobile + the freeze/purchase
                        callbacks; unknown ids fall back to the overview page. No layout of its own
    customer/           One dedicated page per portal feature. Every page starts with PageHeader and has
                        overflowX:"hidden" on its root; new-page grids use the customer-page-grid-2/3 classes:
      OverviewPage.jsx         AccountCard + 3 quick-action cards (→ onNavigate to the feature pages) +
                               a browser-extension card (ExtensionStatus pill + download link + install
                               steps) in the same grid + the last 3 UNREAD notifications from context
                               (hook-per-row subcomponent)
      CallVerifyPage.jsx       CallVerification centered at max-width 600px (100% on mobile)
      ScamCheckPage.jsx        ScamChecker + RiskReport below it; owns the analysisResult state and the
                               required-field modal that used to live in CustomerView
      PurchaseProtectPage.jsx  "How it works" 3-step card + PurchaseCheckout (which renders the
                               interception overlay / transaction result itself, unchanged)
      AccountPage.jsx          AccountCard + its own GET /account/me fetch feeding a recent-activity list
                               (placeholder until the backend returns a transactions array) and a
                               security-status card (status badge + protected chip)
      EmergencyFreezePage.jsx  Fetches GET /account/me: status "frozen" → frozen status card; otherwise
                               warning card + what-gets-stopped list + large btn-danger freeze button
                               (≥56px on mobile) calling onFreezeRequest() with NO analysis result (see the
                               case-less freeze caveat in What's NOT Done) + contact-the-bank fallback row
    BankView.jsx        Routes on the bankPage prop: "dashboard" → header + StatsCards + CasesTable
                        (byte-identical to before), "cases" → same minus StatsCards, "audit-log" →
                        AuditLogPage (CaseDetailPanel stays mounted in that branch so a notification
                        click-through opens its case from any SOC page). Error banner + retry; XLSX case
                        export. Forwards searchQuery → CasesTable externalSearch (dashboard/cases only)
    bank/
      AuditLogPage.jsx  SOC audit-trail viewer (officer-only endpoint): filter card (from/to date inputs
                        defaulting to the last 7 Saudi calendar days, action-category dropdown mapped to
                        contains-filter tokens, 400ms-debounced user-id/IP search), server-paged table
                        (20 rows desktop / 10 mobile; IP column hidden on mobile), ACTION_LABELS bilingual
                        token map (displayAction falls back to the raw "METHOD /path" string or a
                        Title-cased token — never a raw unknown token), Saudi-time timestamps via
                        ar-SA-u-ca-gregory / en-GB + Asia/Riyadh (bare "ar-SA" renders Hijri — never use it)
                        with useRelativeTime hover tooltips, colored HTTP-status chips, and a two-sheet
                        XLSX export (fetches up to 5000 filtered rows; data sheet + summary sheet with
                        totals / report period / top action / freeze + analysis counts; RTL workbook view
                        in Arabic; SheetJS CE cannot write cell fills, so no colored headers)

  test/
    setup.js                @testing-library/jest-dom setup
    test-utils.jsx          renderWithApp() wraps components in AppProvider
    RiskReport.test.jsx     Component renders + freeze callback (receives the full analysis result)
    CasesTable.test.jsx     Row rendering + highlight logic
    BankView.test.jsx       Mocks fraudService + XLSX.writeFile, asserts the exported workbook contents
    fraudService.test.js    Mocks global fetch — asserts request shape and that failures throw ApiError (no fallback)
    Sidebar.test.jsx        Mobile drawer behavior
    SettingsPanel.test.jsx  Theme/language switching

  App.jsx             App() computes isMobile (window.innerWidth < 768, updated on resize) once and threads it
                      as a prop to LoginView + AppShell → Topbar/Sidebar/CustomerView/BankView (never via
                      context). AppShell owns sidebarOpen (collapse/drawer toggle, default open on desktop),
                      customerPage (default "overview"; resets on every login because AppShell remounts when
                      auth flips) + the shared handleCustomerNavigate(pageId) — sets the page AND closes the
                      mobile drawer; passed to Sidebar (onCustomerPageChange), Topbar (onNavigate, for
                      SearchDropdown) and CustomerView (onNavigate) — bankPage (default "dashboard") +
                      handleBankNavigate with the same drawer-closing behavior (→ Sidebar onBankPageChange +
                      BankView bankPage) — the topbar search state (searchQuery
                      raw → Topbar; debouncedSearch, a 300ms setTimeout copy → BankView only) + the freeze
                      flow (executeFreeze catches API failures → freeze_failed_title danger modal), renders
                      Sidebar+Topbar+views + the mobile sidebar backdrop
  main.jsx            Entry point — wraps App in AppProvider
  index.css           All CSS: custom properties, dark mode, utility classes

backend/
  src/main/java/com/amanguard/backend/
    common/                          CORS config, global exception handler, ApiErrorResponse
    feature/
      account/                      GET /api/account/me — account row + stats COMPUTED from real activity
                                    (analyses today / last 30d, approved freezes)
      notifications/                GET /api/notifications, PATCH /api/notifications/{id}/read,
                                    PATCH /api/notifications/read-all — rows carry type + optional caseId +
                                    recipient_national_id. Per-user filtering (NotificationServiceImpl via
                                    CurrentUserService): officers see broadcasts (recipient NULL), customers
                                    see only their own; a user can't read/modify another user's notification
      customers/                    GET /api/customers/{nationalId} — 4 seeded demo customers (IDs
                                    1010101010 / 2020202020 / 3030303030 / 4040404040)
      callverification/             GET /api/call-status — no params; checks the current user's registered
                                    number server-side (placeholder TODO until telephony integration; BankCall
                                    rows are the future active-calls registry)
      fraudanalysis/                POST /api/analyze — AI-first fraud analysis. AiEngineClient (client/) calls
                                    the Python engine (POST {amanguard.ai.engine-url}/analyze-message, body
                                    {message_text}); on timeout/error/non-2xx it logs a metadata-only WARN and
                                    falls back to the existing rule-based scoring (never crashes). Response adds
                                    analysisSource:"ai"|"rules"; still fully bilingual (titleAr/En, detailAr/En,
                                    recommendationAr/En, riskLabelAr/En — English mirrors the Arabic-only engine
                                    output), persists FraudCase. Never logs message text or the API key.
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
      auth/                         POST /api/auth/* — JWT auth, wired to the frontend. /login takes
                                    { nationalId, password } → { token, refreshToken, role, userId, name,
                                    nameEn } (password checked with BCrypt against AuthUser.passwordHash,
                                    stored in the pin_hash column). /logout blacklists the access token.
                                    AuthDataInitializer idempotently seeds the two demo logins
                                    (customer 1234567890 / officer 0987654321, both password "Password123!").
                                    /otp + /refresh remain as alternative auth paths but aren't used by the
                                    current password-login frontend.
      analytics/                    GET /api/analytics/* — SOC chart data (fraud trends, risk breakdown,
                                    top patterns, amounts saved). Not yet consumed by the frontend.
      audit/                        AuditLogInterceptor persists the audit trail: ALL bank-officer requests
                                    (unchanged behavior) + customers' non-GET requests (their GETs are
                                    skipped so 60s notification polling doesn't flood the table), with
                                    semantic action tokens (VIEW_CASES, CREATE_CASE, ANALYZE_TEXT,
                                    REQUEST_FREEZE, ANALYZE/CONFIRM/CANCEL_TRANSACTION, ...) and a user_role
                                    column (V6). /api/auth/* is never audited → no LOGIN/LOGOUT rows exist.
                                    GET /api/audit-logs (officer-only) is paged + filterable:
                                    ?page&size&from&to (ISO dates read as Saudi calendar days) &action
                                    (contains) &search (user id or IP) → { content, totalElements,
                                    totalPages, number }; rows carry userId, userRole, action,
                                    entityType/entityId (derived from numeric path segments — /cases/active
                                    is NOT an entity), ipAddress, httpStatus, createdAt (ISO-8601 at +03:00).
                                    Consumed by views/bank/AuditLogPage.
      integration/                  Stub controllers/DTOs for future bank integrations
                                    (/api/open-banking, /api/sms, /api/telephony, /api/merchant-registry).
      realtime/                     WebSocket config (/ws) + RealtimePublishService + test controller —
                                    groundwork for INT-002 live case updates; frontend not wired to it yet.
    security/                        SecurityConfig — role-gated endpoint rules (CUSTOMER vs BANK_OFFICER,
                                     shared endpoints .authenticated()) + JwtAuthenticationFilter (Bearer
                                     token → Spring Security context) + registers RateLimitingFilter.
    common/security/                 CurrentUserService — reads the JWT principal (currentNationalId(),
                                     isOfficer()/isCustomer()); shared by AI audit logging, per-user
                                     notification filtering, and the rate-limit key.
    common/ratelimit/                RateLimitingFilter — in-memory Bucket4j, per-(actor, endpoint-class)
                                     quota; actor = JWT national id, else client IP. On exceed: HTTP 429 +
                                     Retry-After: 60 + { error, messageAr, messageEn, retryAfterSeconds }.
  src/main/resources/application.yaml   MySQL (127.0.0.1:3306) + Flyway, JWT settings, fraud thresholds,
                                        amanguard.ai.* (engine-url / api-key / timeout-ms / fallback-enabled), port 8080
  src/main/resources/db/migration/      Flyway migrations: V1 schema, V2 demo seed data, V3 audit logs,
                                        V4 adds auth_users.display_name_en (bilingual login name),
                                        V5 adds notifications.recipient_national_id (per-user notifications)
  src/main/resources/merchants.json     Known-merchants whitelist (transaction rule 3) — demo stand-in for a real registry
  src/main/resources/fraud_keywords.json Suspicious URL keywords (transaction rule 2)
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
  currentUser,          // { name, nameEn, role } — from the login response, persisted in localStorage
  isAuthenticated,      // bool — false renders <LoginView>, true renders the app shell (see App.jsx)
  completeLogin,        // (loginResponse) => void — store token+user, flip into the app (called by LoginView)
  logout,               // () => Promise — POST /auth/logout, clear the session, return to login
} = useApp();
```

**Never use local modal state** — always go through `showModal` / `closeModal` from context.

**Never use local panel state** — always go through `openPanel` / `closePanel`.

**`currentUser` comes from the JWT login.** `completeLogin` writes `{ name, nameEn, role }` to localStorage (`amanguard_user`), the access token to `amanguard_token`, and the refresh token to `amanguard_refresh_token`; `AppProvider` re-reads them on mount so a reload restores the session. `AppContext` also listens for the `amanguard:unauthorized` window event (dispatched by `client.js` when a refresh fails) and resets auth state back to the login screen. `role` is the raw backend value (`"CUSTOMER"` / `"BANK_OFFICER"`) and drives the default view in `App.jsx`. Everything that shows the logged-in identity (Sidebar chip, freeze-flow customer name) reads from `currentUser`.

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

There is **no mock mode**. Every function in `fraudService.js` calls the real backend and lets errors propagate as `ApiError` (thrown from `client.js`, carrying `.message` from the backend's JSON error body and `.status`). Components own their own loading/error/retry state — see `AccountCard.jsx` and `BankView.jsx` for the pattern. On a **429** the rate-limit body has `messageEn/messageAr` (not `message`); `client.js` falls back to those, and callers that check `err.status === 429` show the localized `rate_limit_exceeded` string inline (see ScamChecker + PurchaseCheckout).

There is **no mock mode**. Every request carries the JWT **access** token as a Bearer header (see `client.js`). When the 30-minute access token expires the next request 401s; the client then **transparently refreshes the session** (POST `/auth/refresh` with the stored refresh token) and replays the original request, so the user is never interrupted. Refreshes are single-flighted — if several requests 401 at once, only the first calls `/auth/refresh` and the rest queue (`failedQueue`) and replay with the new token. The login screen appears **only** when the refresh itself fails (refresh token missing/expired/invalid): the client clears all three localStorage keys (`amanguard_token`, `amanguard_refresh_token`, `amanguard_user`) and dispatches a window `amanguard:unauthorized` event, which `AppContext` listens for to reset auth state → `App` renders `<LoginView>`.

### Token storage & refresh flow
- **Both tokens live in localStorage.** `completeLogin` (AppContext) stores `amanguard_token` (access) + `amanguard_refresh_token` (refresh) + `amanguard_user`; `logout`/`fraudService.logout` and the refresh-failure path clear all three. `client.js` exports `REFRESH_TOKEN_KEY = "amanguard_refresh_token"`.
- **The refresh is fully invisible** — no loading state, no modal, no toast. `session_expired` / `session_refreshed` translation keys exist for optional UI but the current flow shows neither (the refresh is silent; a hard failure just swaps to the login screen).
- **Backend `POST /api/auth/refresh`** takes `{ refreshToken }` and returns the full `LoginResponse` (`{ token, refreshToken, role, userId, name, nameEn }` — a **rotated** refresh token each call). An expired/invalid/mismatched refresh token returns **HTTP 401** (`BadCredentialsException` → `GlobalExceptionHandler`), which the client treats as a dead session.

### Backend endpoints
| Function | Method | Endpoint | Used by |
|---|---|---|---|
| `login(nationalId, password)` | POST | `/auth/login` | LoginView (raw fetch, bypasses the 401 handler) |
| _(refresh)_ | POST | `/auth/refresh` | `client.js` only — automatic on 401, never called from a component |
| `logout()` | POST | `/auth/logout` | AppContext logout |
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
| `getAuditLogs(params)` | GET | `/audit-logs?page&size&from&to&action&search` | AuditLogPage (table + export) |

### Response shapes
```js
// login → {
//   token, refreshToken,
//   role: "CUSTOMER" | "BANK_OFFICER",
//   userId, name, nameEn
// }
// completeLogin persists token → "amanguard_token" and { name, nameEn, role }
// → "amanguard_user". logout → { message } (local session cleared regardless).

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
//   interruptionQuestions: [{ id, textAr, textEn }],   // bilingual; RiskReport picks by lang
//   caseId: number | null,  // real, persisted FraudCase id — used to freeze
//   analysisSource: "ai" | "rules"   // which engine produced this result (drives the RiskReport chip)
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

### `/analyze` — AI engine first, rule-based fallback
`FraudAnalysisServiceImpl` (backend) calls the Python AI engine via `AiEngineClient` when
`amanguard.ai.fallback-enabled` is true (default): `POST {amanguard.ai.engine-url}/analyze-message`
with `{ "message_text": text }`, connect timeout 5s / read timeout `amanguard.ai.timeout-ms` (8s). The
engine (`AI/phishingGPT.py`, FastAPI + OpenAI, keyless on `localhost:8000`) returns Arabic-only
`{ is_phishing, risk_score, risk_level, recommended_action, reasons, red_flags }`.

**Bilingual findings (parallel calls):** the engine's system prompt forces Arabic output, so `AiEngineClient`
fires two overlapping calls per analysis — an **authoritative Arabic call** (clean, unmodified text → drives
score/level/persistence) on the calling thread, and a **best-effort English call** (same text prefixed with
an English instruction) on a small daemon executor, capped at 10s. `analyzeWithAi` pairs them into `findings[]`
(titleAr/detailAr from the Arabic call, titleEn/detailEn from the English call, falling back per-item to the
Arabic text). If the English call fails/times out — or the engine ignores the in-message instruction and still
answers Arabic — the English fields mirror the Arabic, so display degrades gracefully (and it costs two OpenAI
calls per analysis). Labels/recommendation/questions/`caseId` derive from `RiskLevel` (already bilingual); the
result is tagged `analysisSource: "ai"`. On any timeout/error/non-2xx it logs a WARN with
**metadata only** (userId + text length — never message content) and runs the original deterministic keyword
scoring (OTP requests, urgency phrasing, suspicious links, remote-access-tool mentions, …), tagged
`analysisSource: "rules"`. The frontend `/api/analyze` JSON contract is unchanged apart from the added
`analysisSource` (surfaced as a gold "AI" / gray "rules" chip in `RiskReport`).

**Security invariants (never violate):** `AiEngineClient` adds `Authorization: Bearer` only when
`amanguard.ai.api-key` is non-blank; the API key and the analyzed text are never logged, returned in any
response body, or committed. TLS verification is never disabled. The engine's own `OPENAI_API_KEY` lives
only in the Python `.env` and is never referenced in Java or in logs.

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

### Topbar search flow (global search)
State lives in `AppShell` (App.jsx): `searchQuery` (raw keystrokes) + `debouncedSearch` (300ms `setTimeout` copy — the only debounce in the chain).
- **App.jsx → Topbar**: `searchQuery={searchQuery}` + `onSearch={setSearchQuery}` — controlled input, passes the raw value up on every keystroke.
- **App.jsx → BankView → CasesTable**: `searchQuery={debouncedSearch}` → `externalSearch={searchQuery}`. A non-empty `externalSearch` overrides the table's local search (`externalSearch || query` — deliberately `||`, not `??`, because App always passes a string) and resets the local input whenever it changes; when empty, the table's own search input works independently.
- **Customer view**: the debounced value is NOT used. Topbar itself renders `SearchDropdown` while the raw query is non-empty, matching `CUSTOMER_PAGES` keywords/labels/descs; picking a result calls the shared navigate handler and clears the query (which closes the dropdown). The old hint card is gone (`search_results_for` / `search_customer_hint` keys remain in translations.js but are unused).
- Empty filter result while a search is active shows `no_search_results — "term"`; an empty table with no search shows `no_cases`.

### Customer portal navigation (multi-page)
There is still **no routing library**. `customerPage` (AppShell state in App.jsx) is the single source of
truth: the Sidebar sub-nav, the topbar SearchDropdown, and the Overview quick-action cards all call the same
`handleCustomerNavigate(id)`, and CustomerView renders the matching `views/customer/*Page`; the Topbar shows
that page's bilingual label + description. Pages remount on every switch, so per-page state (e.g.
ScamCheckPage's analysis result) is intentionally lost when navigating away. **To add a portal page:** add an
entry to `src/data/customerPages.js`, a `page_*` / `page_*_desc` translation pair, a component in
`src/views/customer/` (PageHeader at the top, `overflowX:"hidden"` root), and one line in CustomerView's map.
Mobile reflow for new pages uses the `customer-page-grid-2` / `customer-page-grid-3` `!important`
media-query classes in index.css (they must beat the inline desktop `gridTemplateColumns`), card padding
drops to 12–16px, and buttons keep ≥44px tap targets.

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
./mvnw spring-boot:run   # → http://localhost:8080/api — needs MySQL on 127.0.0.1:3306
                         #   (database amanguard_db; Flyway runs the migrations on startup)

# Optional AI engine (from AI/) — start it so /api/analyze uses AI; if it's down,
# analysis automatically falls back to rule-based scoring (never crashes).
python phishingGPT.py    # → http://localhost:8000  (needs OPENAI_API_KEY in AI/.env)
```

The frontend expects the backend running at `VITE_API_BASE_URL` (default `http://localhost:8080/api`) — there's no mock fallback, so components will show their error/retry states if it's down. See `backend/README.md` for backend-specific setup (DB swap, AI engine integration point).

### Docker (full stack)

```bash
docker compose up -d --build
# Frontend  → http://localhost:3000  (5173 stays free for npm run dev; CORS already allows :3000)
# Backend   → http://localhost:8080/api
# MySQL     → host port 3307 (containers use mysql:3306; 3307 avoids a local MySQL clash)
# AI engine → deliberately NOT published (keyless service; backend-only over the compose network)
```

- `Dockerfile` (root) + `nginx.conf` — frontend: node:22-alpine build → nginx:alpine serve. `VITE_API_BASE_URL`
  is a **build ARG** (baked into the bundle, must be browser-reachable) — set in docker-compose.yml, not at runtime.
- `backend/Dockerfile` — maven:3.9-temurin-17 build → temurin-17-jre-alpine. Deliberately uses the maven image,
  NOT `./mvnw` (Windows checkouts can break the wrapper via CRLF/exec-bit). All config via env vars:
  `SPRING_DATASOURCE_URL/USERNAME/PASSWORD`, `AI_ENGINE_URL=http://ai-engine:8000`, optional `AMANGUARD_JWT_SECRET`.
- `AI/Dockerfile` — python:3.12-slim + `AI/requirements.txt`; starts `uvicorn phishingGPT:app --host 0.0.0.0`
  because the script's own `__main__` binds 127.0.0.1 (unreachable between containers). `AI/.dockerignore`
  keeps `.env` (the OpenAI key) out of the image; compose passes `OPENAI_API_KEY` from the shell or root `.env`.
- MySQL 8.4 with utf8mb4 + healthcheck; the backend waits on `service_healthy` so Flyway runs after the DB is up.

---

## Browser Extension Integration

The Chrome extension in `extention/src/` (MV3: `manifest.json`, `background.js` service worker,
`content.js`, `overlay.css`, `popup.html` + `popup.js`) intercepts card-payment forms on any site,
scores the destination via its own Python engine (`http://127.0.0.1:8000/analyze-url`) plus
client-side rules, and shows a full-screen Shadow-DOM warning overlay branded as AmanGuard. It is
wired to the web app as follows. **`extention/**` is in the ESLint ignore list — those files are
not linted; keep it that way.** There is **no hardcoded extension id** anywhere — detection and
token hand-off both go through a `window.postMessage` bridge.

**postMessage bridge (no extension id) — automatic on login, mount, and refresh.** Token hand-off is
fully automatic, with no user action: the web app broadcasts
`window.postMessage({ source:"AMANGUARD_WEB", action:"SET_AMANGUARD_TOKEN", token, user }, window.location.origin)`
at three points, so the extension connects within ~1s of the token existing:
- **login + page refresh** — `src/App.jsx#sendTokenToExtension`, called from an effect that fires
  whenever `isAuthenticated` becomes true (token-save lives in `AppContext.completeLogin`, so App
  watches the auth flag rather than hooking the save; the effect also runs on mount, covering a
  reload that restored a session);
- **silent token refresh** — `src/api/client.js#refreshAccessToken` re-posts the same message right
  after storing the refreshed access token, so the extension never falls out of sync.

`user` is the cached `amanguard_user` JSON string (`{ name, nameEn, role }`). The extension's
`content.js` runs in the page, listens for `message` events (same-origin only,
`source==="AMANGUARD_WEB"`), and relays token **and user** to `background.js` as
`STORE_TOKEN_FROM_PAGE` (only the background has `chrome.storage` access). `ExtensionStatus.jsx`
does the install probe the same way: it posts `PING_EXTENSION`; the content script replies
`window.postMessage({ source:"AMANGUARD_EXTENSION", action:"PONG" })`; no PONG within 1s →
"not installed". `sendTokenToExtension` no longer guards on `window.chrome` — it always posts
(postMessage never throws; if the extension isn't installed nothing listens), which is what makes
auto-connect reliable. The JWT is passed straight through and **never logged**.
`externally_connectable` is kept in the manifest for possible future direct messaging but is not
required by this bridge.

**Token storage + user (`background.js`).** `STORE_TOKEN_FROM_PAGE` calls `storeToken(token, user)`,
storing `amanguard_token`, `amanguard_connected:true`, and `amanguard_user` (`{ name, nameEn, role }`
JSON) in `chrome.storage.local`. It **prefers the `user` blob passed from the page** (the web app's
cached `amanguard_user`); only if that's absent does it fall back to base64url-decoding the JWT
payload (`decodeUserFromToken`, best-effort in try/catch — never logs). The backend JWT now includes
`name`/`nameEn` claims (see `JwtServiceImpl`), so the decode fallback also yields the real name; the
overlay footer and popup show the real name + role.

**Detection rules (`background.js` `analyze_payment`).** After the Python engine's three checks
(cross-domain form hijack, domain age, AI typosquatting) run three client-side rules on
`actionUrl`: (4) typosquatting against a known-brand variant list → Critical; (5) suspicious TLD
(`.ru .tk .xyz .pw .cc .top .work .click .link`) → at least High; (6) plain `http:` (non-localhost)
payment page → at least High. Each pushes a bilingual reason (Arabic + English lines).

**SOC reporting with report number.** After scoring, the handler saves `amanguard_last_scan`
(`{ risk_level, domain, timestamp }`) for the popup, then for **High/Critical** awaits
`reportToAmanGuard()` — a POST to `http://localhost:8080/api/transactions/analyze` (Bearer token,
`{ merchantName, merchantUrl, amount:0, currency:"SAR", transactionType:"ONLINE_PURCHASE",
source:"EXTENSION", riskLevel, reasons }`) that returns the backend's `reportNumber`. It fails
silently (returns null, never blocks) when there's no token or the backend is down. The response to
the content script is `{ risk_level, reasons, reportNumber }`.

**Overlay (`content.js`).** `injectShadowUI` renders the branded modal (gradient header with the
Aman**Guard** wordmark, connection dot, pulsing risk icon, an SVG risk-score gauge, bilingual
title/message, reasons list, recommendation box, report-number line, and a footer with the logged-in
user avatar/name). `updateShadowUI` maps risk level → score/color, fills the gauge, shows reasons
(❌) + recommendation for High/Critical, shows the `reportNumber` when present, and reads
`amanguard_user` / `amanguard_connected` from storage for the footer + connection line. Buttons:
Cancel (stops the transaction), Proceed-at-own-risk (`triggerResumeAllFrames`), Full Analysis (opens
`http://localhost:5173`), and Report (confirms the auto-report already sent to SOC). All existing
iframe-broker / resume logic is unchanged.

**Popup (`popup.html` + `popup.js`).** Toolbar popup (registered via manifest `action.default_popup`)
showing connection status, protection status, the logged-in user (`amanguard_user`), and the last
scan (`amanguard_last_scan`), with an "Open Portal" button (and an "SOC Dashboard" button for
`BANK_OFFICER`). It reads only `chrome.storage.local` so it works whether or not the user is
connected. Uses `chrome.tabs.create`, so the manifest adds the `tabs` permission.

**Download from the app (`/extension-download` ZIP).** The portal serves the extension itself — no
GitHub link. `OverviewPage.jsx`'s download button opens `public/extension/download.html` (a static
bilingual install-instructions page) which `fetch`es **`GET /extension-download`** and saves it as
`amanguard-extension.zip`. That endpoint is provided by the `amanguard-extension-download` Vite
plugin in `vite.config.js`, which zips the canonical `extention/src/` (via `archiver`'s ESM
`ZipArchive`) — **the single source of truth**; there are no per-file copies under `public/`. The
plugin covers all run modes: a `configureServer` middleware for `npm run dev`, a
`configurePreviewServer` middleware for `npm run preview`, and a `generateBundle` hook that emits the
zip as the static file `extension-download` at the `dist/` root for `npm run build` (so a plain
static host / nginx resolves `/extension-download` in production too). `vite.config.js` runs in Node,
so `eslint.config.js` has a Node-globals override for it (for `Buffer`).

**Enable / disable protection (postMessage bridge).** `ExtensionStatus.jsx` shows an enable/disable
toggle below the status pill (only when `status === "connected"`) that posts
`{ source:"AMANGUARD_WEB", action:"ENABLE_EXTENSION" | "DISABLE_EXTENSION" }`. `content.js` handles
those in its window-message listener, flips an `isExtensionEnabled` flag, and persists
`amanguard_enabled` to `chrome.storage.local`; it reads that key on load so the choice **survives
page refreshes**. `freezeTransaction()` early-returns when disabled, so the extension is completely
silent — no overlay, no interception, the payment passes through — and re-enabling restores
protection immediately without reloading. `popup.js` reflects the state in the protection badge
(green "Active" / red "Disabled"). (The portal toggle's own label is local UI state, defaulting to
enabled on a fresh page load; the persisted extension behavior is the source of truth.)

---

## Current State

What genuinely works end-to-end right now (frontend ↔ backend), what exists on one side only, and what's missing.

**Working end-to-end (when the backend endpoints are reachable):**
- **Authentication** — national-id + password login (`LoginView` → POST /api/auth/login), access + refresh JWTs stored in localStorage, access token sent as a Bearer header on every request. **Silent token refresh**: an expired access token (401) triggers an automatic, single-flighted POST /api/auth/refresh and request replay in `client.js` — invisible to the user; the login screen appears only when the refresh token itself is missing/expired/invalid (backend returns 401). Role-based default view (officer → bank, customer → portal), Sidebar sign-out. `currentUser` is populated from the login response (no longer a placeholder). Demo logins: customer `1234567890` / officer `0987654321`, both password `Password123!`.
- **AI-first fraud analysis** — POST /api/analyze calls the Python AI engine and falls back to rule-based scoring if it's unreachable; `RiskReport` shows a gold "Analyzed by AI" / gray "Rule-based" chip from `analysisSource`
- **Browser-extension integration** — a `window.postMessage` bridge (no hardcoded extension id) hands the web app's JWT to the Chrome extension on login and powers the portal's install-status card (`ExtensionStatus`, PING/PONG). The extension decodes the JWT for user info, runs extra client-side detection rules (typosquatting / suspicious-TLD / non-HTTPS), reports High/Critical payments to `/api/transactions/analyze` and surfaces the returned report number in a branded Shadow-DOM overlay (risk gauge, reasons, user footer), and ships a toolbar popup (connection + last scan + open-portal). The extension is downloadable straight from the portal as a ZIP (`GET /extension-download`, zipped from `extention/src` by a Vite plugin) and can be enabled/disabled from the portal via a postMessage toggle (persisted in `chrome.storage.local`). See "Browser Extension Integration" above
- **Per-endpoint rate limiting** — Bucket4j filter (analyze 30/min, auth/login 5/min/IP, transactions/analyze 20/min, freeze 10/min, else 100/min); 429 surfaces inline (`rate_limit_exceeded`) in ScamChecker + PurchaseCheckout, not a modal
- **Role-based access** — a customer only ever sees the portal and an officer only the SOC dashboard (Sidebar renders one nav item; App.jsx derives the view from role so it can't be switched), enforced again in SecurityConfig; notifications are scoped per user
- Full customer portal, now **multi-page** (overview / call verify / message scan / purchase protection / my account / emergency freeze) — sidebar sub-nav, topbar search dropdown, and overview quick actions all drive the same customerPage state. Features unchanged: one-button call verify (GET /api/call-status), fraud text analysis (POST /api/analyze) + risk report, purchase simulation with allow / suspend (interception overlay) / block gating; plus the new account-detail and standalone emergency-freeze pages
- Full bank SOC dashboard, now with a sidebar sub-nav (dashboard / cases / audit log via bankPage state): live stats with trend deltas, sortable/searchable case table with relative timestamps, case detail drawer with freeze / escalate / dismiss / edit, manual case entry with national-id autofill, XLSX export
- SOC audit log page: server-paged + filterable audit trail (Saudi-day date range, action category, user-id/IP search), Saudi-time timestamps with relative-time tooltips, and a two-sheet XLSX export (data + summary, RTL-aware workbook)
- Topbar global search (frontend-only): bank view — debounced 300ms in App.jsx, filters the SOC cases table (overrides its local search input); customer view — SearchDropdown over CUSTOMER_PAGES keywords that navigates between portal pages
- Freeze request → bank-approval workflow (customer freezes are PENDING until staff approve; staff freezes approve immediately)
- Notifications: backend-fetched, 60s polling, mark read / mark all read, click-through to the linked case
- Dark/light theme, Arabic/English toggle with full RTL/LTR swap, correct financial-domain Arabic throughout
- Full Vitest suite mocking the network layer directly (no ambient backend dependency); `npm run lint` and `npm run build` clean

**Backend-only (implemented server-side, no frontend consumer yet):**
- **Analytics** — GET /api/analytics/* chart data endpoints
- **WebSocket realtime** — `/ws` config + publish service (INT-002 groundwork); the bank dashboard still simulates live updates by prop injection (`App.jsx` → `BankView`'s `injectedCase`) + polling
- **Integration stubs** — open-banking / SMS / telephony / merchant-registry placeholder endpoints
- **Interruption-question scoring** — POST /api/verifications/evaluate exists; `RiskReport`'s 3 checkboxes are still local UI state only

## What's NOT Done Yet ❌

- **Registration / account management** — login only; no signup, password change, or user admin. Demo users are seeded by `AuthDataInitializer`.
- **AI on the purchase path** — `/api/analyze` now calls the Python AI engine (with automatic rule-based fallback), but `/api/transactions/analyze` is still deterministic rule-based scoring (merchant whitelist + URL keyword lists in `backend/src/main/resources/merchants.json` / `fraud_keywords.json`) and is not yet wired to the engine. The engine itself (`AI/phishingGPT.py`) is OpenAI-backed, not a locally trained model, and emits Arabic-only output (English findings mirror the Arabic until the engine is bilingual).
- **Frontend WebSockets** — backend `/ws` exists; the frontend still relies on polling + prop injection.
- **Responsive / mobile layout** — Core views are now responsive below 768px via an `isMobile` prop (computed once in `App.jsx`, threaded down — new mobile work uses inline `isMobile ? …` conditionals, not Tailwind responsive classes): the sidebar collapses to an icon rail (desktop) / slides in as a drawer (mobile), the cases table drops the pattern + account columns, stats/forms/interception overlay reflow, and slide-in panels go full-width (`.panel-drawer` media query). Desktop (≥768px) is unchanged. Not every micro-layout is tuned for the smallest phones.
- **Case-less emergency freeze** — POST /api/freeze requires an existing fraud case (`validateFraudCase` rejects a null caseId), so the standalone button on EmergencyFreezePage currently gets a backend error, surfaced via the freeze_failed_title modal. Freezes from RiskReport / purchase-stop work because those flows create a case first. Needs a nullable-caseId freeze path server-side.
- **Login/logout audit rows** — the audit interceptor skips /api/auth/* (a login request has no authenticated principal to attribute), so the audit page's "Login" filter and the LOGIN/LOGOUT labels have no matching data until auth events are recorded from the auth service itself.
- **Pagination** — Cases table shows the 20 most recent cases with no pagination.

---

## Git

- Repo: `https://github.com/ep2wq/Aman-Guard-.git`
- Branch: `main`
- All commits by Claude use `ep2wq` as author
