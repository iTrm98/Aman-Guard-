# AmanGuard — Claude Code Project Brief

> Read this file before touching any code. It covers everything about the project: stack, architecture, patterns, and what's done vs. what's next.

---

## What Is AmanGuard?

AmanGuard is a **financial fraud prevention web app** built for the **Amad Hackathon (مسار التشريعات المالية — Financial Regulations Track)**. It is a React frontend that will connect to a Java Spring Boot backend.

The app has two views that share the same shell:

1. **Customer Portal (بوابة العميل)** — A client-facing interface where users can verify bank calls, paste suspicious messages/links for AI analysis, view a risk report, and freeze their account in an emergency.
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

**There is no routing library** — view switching is done via a single `view` state in `AppShell` (`"customer"` or `"bank"`).

---

## Project Structure

```
src/
  api/
    client.js           Base HTTP client (fetch wrapper, ApiError class)
    fraudService.js     4 service functions — each calls real API or falls back to mock
    mockData.js         Realistic mock responses shaped to match backend contracts

  context/
    AppContext.jsx      Single global context: theme, lang, t(), modal, panel, notifications
    useApp.js           Re-exports useApp hook (kept separate for react-refresh compatibility)

  i18n/
    translations.js     Object T with 70+ keys, each { ar: "...", en: "..." }

  components/
    layout/
      Modal.jsx               Animated modal (danger / success / info types)
      Sidebar.jsx             Dark navy sidebar with nav, notifications, settings, logout
      Topbar.jsx              Header: title, search, language toggle, theme toggle, bell
      NotificationsPanel.jsx  Slide-in drawer — notification list + mark all read
      SettingsPanel.jsx       Slide-in drawer — theme picker + language picker + app info

    customer/
      AccountCard.jsx         Bank card widget: masked balance, security badges, mini stats
      CallVerification.jsx    Verify if caller is real bank employee (GET /call-status)
      ScamChecker.jsx         Paste suspicious text → AI analysis (POST /analyze)
      RiskReport.jsx          SVG gauge + findings list + interruption questions + freeze CTA

    bank/
      StatsCards.jsx          4 KPI cards: critical cases, monitoring, frozen accounts, saved amounts
      CasesTable.jsx          Sortable + searchable fraud cases table with export button
      CaseDetailPanel.jsx     Slide-in drawer: case details, timeline, Freeze/Escalate/Dismiss

  views/
    CustomerView.jsx    Assembles AccountCard + CallVerification + ScamChecker + RiskReport
    BankView.jsx        Assembles StatsCards + CasesTable + CaseDetailPanel, handles CSV export

  test/
    setup.js                @testing-library/jest-dom setup
    RiskReport.test.jsx     Component renders + freeze callback
    CasesTable.test.jsx     Row rendering + highlight logic
    fraudService.test.js    All 4 mock API endpoints return correct shapes

  App.jsx             AppShell: owns view state, freeze flow, renders Sidebar+Topbar+views
  main.jsx            Entry point — wraps App in AppProvider
  index.css           All CSS: custom properties, dark mode, utility classes
```

---

## Global State — AppContext

**File:** `src/context/AppContext.jsx`
**Hook:** `import { useApp } from "../context/useApp"`

Every component gets these values from `useApp()`:

```js
const {
  lang,           // "ar" | "en"
  theme,          // "light" | "dark"
  t,              // t("key") → translated string. t("key", { n: value }) for interpolation
  toggleTheme,    // () => void
  toggleLang,     // () => void
  notifications,  // array of notification objects
  markAllRead,    // () => void
  unreadCount,    // number
  modal,          // { open, title, message, type, showCancel, confirmText, onConfirm }
  showModal,      // (config) => void
  closeModal,     // () => void
  panel,          // { type: "notifications" | "settings" | null, data }
  openPanel,      // (type, data?) => void
  closePanel,     // () => void
} = useApp();
```

**Never use local modal state** — always go through `showModal` / `closeModal` from context.

**Never use local panel state** — always go through `openPanel` / `closePanel`.

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

---

## API Layer

**Files:** `src/api/fraudService.js`, `src/api/client.js`, `src/api/mockData.js`

### Backend endpoints (Spring Boot)
| Function | Method | Endpoint | Used by |
|---|---|---|---|
| `checkCallStatus()` | GET | `/call-status` | CallVerification |
| `analyzeText(text)` | POST | `/analyze` | ScamChecker |
| `freezeAccount({caseId, reason})` | POST | `/freeze` | App.jsx freeze flow |
| `getActiveCases()` | GET | `/cases/active` | BankView |

### Mock mode
- Controlled by `VITE_USE_MOCKS` in `.env`
- Default is `true` — all calls return mock data from `mockData.js` with realistic delays
- Set `VITE_USE_MOCKS=false` and `VITE_API_BASE_URL=http://your-backend` to go live
- If the real API fails, it silently falls back to mock — so the UI never breaks

### Response shapes the frontend expects
```js
// checkCallStatus → { hasActiveOfficialCall: bool, message: string }

// analyzeText → {
//   riskScore: number (0-100),
//   riskLevel: "critical" | "high" | "medium",
//   riskLabel: string,
//   findings: [{ title, detail }],
//   recommendation: string,
//   interruptionQuestions: [{ id, text }],
//   caseId: string | null
// }

// freezeAccount → { success: bool, reportNumber: string, message: string }

// getActiveCases → {
//   stats: { criticalToday, suspectedCases, accountsFrozen, amountSaved },
//   cases: [{ id, timeAgo, customerName, fraudPattern, riskScore, riskLevel, accountStatus }]
// }
```

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

### RTL/LTR awareness
- `dir` is set on `document.documentElement` by AppContext on language switch
- Use `insetInlineStart` / `insetInlineEnd` instead of `left` / `right` in inline styles for RTL-aware positioning
- Use `paddingInlineStart` / `paddingInlineEnd` instead of `paddingLeft` / `paddingRight`

---

## Running the Project

```bash
npm install          # Install dependencies
cp .env.example .env # Create local env file (already set to mock mode)
npm run dev          # Dev server → http://localhost:5173
npm run build        # Production build
npm run lint         # ESLint check
npm test             # Run 9 Vitest tests
```

---

## What's Done ✅

- Full customer portal (call verify, AI scam check, risk report, emergency freeze)
- Full bank SOC dashboard (stats, case table, case detail drawer with actions)
- Dark / light theme toggle
- Arabic / English language toggle (full RTL/LTR swap)
- Notifications panel (slide-in, mark-all-read)
- Settings panel (theme + language pickers)
- Sign out confirmation
- CSV export of cases
- Mock API layer with automatic fallback
- 9 passing unit/integration tests
- Correct financial-domain Arabic translations throughout

## What's NOT Done Yet ❌

- **Real backend connection** — Spring Boot not deployed yet. Flip `VITE_USE_MOCKS=false` when ready.
- **Authentication** — No login screen or JWT handling. `App.jsx` renders directly without auth guard.
- **WebSockets** — MVP spec mentions real-time case updates (INT-002) for when a customer freezes their account. Currently simulated by prop injection.
- **Responsive / mobile layout** — Designed for desktop (1080px+). Sidebar collapses on narrow screens are not yet implemented.
- **Real search in Topbar** — The search input in the header has no handler yet.
- **Pagination** — Cases table shows all cases with no pagination.
- **User management** — The user chip in the sidebar is hardcoded (نواف العتيبي).

---

## Git

- Repo: `https://github.com/ep2wq/Aman-Guard-.git`
- Branch: `main`
- All commits by Claude use `claude@anthropic.com` / `Claude` as author
