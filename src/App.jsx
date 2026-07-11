import { useState, useEffect } from "react";
import Sidebar    from "./components/layout/Sidebar";
import Topbar     from "./components/layout/Topbar";
import Modal      from "./components/layout/Modal";
import NotificationsPanel from "./components/layout/NotificationsPanel";
import SettingsPanel      from "./components/layout/SettingsPanel";
import CustomerView from "./views/CustomerView";
import BankView     from "./views/BankView";
import LoginView    from "./views/LoginView";
import { freezeAccount } from "./api/fraudService";
import { UNAUTHORIZED_PURCHASE_PATTERN_AR, BLOCKED_PURCHASE_PATTERN_AR } from "./i18n/fraudPatterns";
import { useApp } from "./context/useApp";

function AppShell({ isMobile }) {
  const { modal, closeModal, showModal, panel, closePanel, t, lang, currentUser } = useApp();
  // Role owns the view: officers get the SOC dashboard, customers the portal.
  // Deriving it (rather than useState) means there is no runtime switch that
  // could ever put a customer on the bank dashboard or vice-versa — the backend
  // enforces the same split.
  const view = currentUser.role === "BANK_OFFICER" ? "bank" : "customer";
  const [frozenCase,    setFrozenCase]    = useState(null);
  const [caseToOpen,    setCaseToOpen]    = useState(null);
  // Sidebar starts open on desktop, closed on mobile. On desktop the topbar
  // toggle collapses it to an icon rail; on mobile it slides in as a drawer.
  const [sidebarOpen,   setSidebarOpen]   = useState(window.innerWidth >= 768);

  function handleOpenCaseFromNotification(caseId) {
    // Officer-only flow — they are already on the bank view, so just open the case.
    closePanel();
    setCaseToOpen(caseId);
  }

  function handleFreezeRequest(analysisResult) {
    showModal({
      title:      t("freeze_confirm_title"),
      message:    t("freeze_confirm_msg"),
      type:       "danger",
      showCancel: true,
      confirmText:t("freeze_confirm_btn"),
      onConfirm:  () => executeFreeze(analysisResult),
    });
  }

  // A purchase was auto-blocked (high/critical) — the backend already created
  // the fraud case (and froze the account for critical, no customer input).
  // Inject the case into the bank dashboard the same way manual freezes do;
  // the customer stays on the blocked result card, no overlay, no modal.
  function handlePurchaseBlocked(blockedResult) {
    setFrozenCase({
      id:            blockedResult.reportNumber,
      createdAt:     new Date().toISOString(),
      customerName:  lang === "en" ? currentUser.nameEn : currentUser.name,
      fraudPattern:  BLOCKED_PURCHASE_PATTERN_AR,
      riskScore:     blockedResult.riskScore,
      riskLevel:     blockedResult.riskLevel,
      accountStatus: blockedResult.riskLevel === "critical" ? "frozen" : "active",
    });
  }

  async function executeFreeze(analysisResult, reason = "customer_initiated") {
    const res = await freezeAccount({ caseId: analysisResult?.caseId, reason });
    showModal({
      title:      t("freeze_success_title"),
      message:    t("freeze_success_msg", { n: res.reportNumber }),
      type:       "success",
      confirmText:t("ok"),
      onConfirm: () => {
        const accountStatus = res.status === "pending" ? "partially_restricted" : "frozen";
        // Injects into the SOC dashboard (consumed only by the officer's BankView);
        // the customer stays on their portal — no cross-role view switch.
        setFrozenCase({
          id:            res.reportNumber,
          createdAt:     new Date().toISOString(),
          customerName:  lang === "en" ? currentUser.nameEn : currentUser.name,
          fraudPattern:  analysisResult?.findings?.[0]?.titleAr ?? analysisResult?.riskLabelAr,
          riskScore:     analysisResult?.riskScore ?? 0,
          riskLevel:     analysisResult?.riskLevel ?? "high",
          accountStatus,
        });
      },
    });
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Modal {...modal} onClose={closeModal} />

      {panel?.type === "notifications" && (
        <NotificationsPanel onClose={closePanel} onOpenCase={handleOpenCaseFromNotification} />
      )}
      {panel?.type === "settings"      && <SettingsPanel      onClose={closePanel} view={view} />}

      {/* Mobile: dim the content behind the slide-in sidebar drawer. */}
      {isMobile && sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.5)", zIndex:30 }}
        />
      )}

      <Sidebar
        view={view}
        onSwitchView={() => { /* view is role-derived; nav is a single fixed item */ }}
        isOpen={sidebarOpen}
        isMobile={isMobile}
        onClose={() => setSidebarOpen(false)}
      />

      <div style={{ display:"flex", flexDirection:"column", flex:1, minWidth:0, overflow:"hidden" }}>
        <Topbar view={view} isMobile={isMobile} onMenuToggle={() => setSidebarOpen((v) => !v)} />
        <main className="p-4 sm:p-5 md:p-7" style={{ flex:1, overflowY:"auto", background:"var(--bg-app)", transition:"background 0.25s" }}>
          <div style={{ maxWidth:1080, margin:"0 auto" }}>
            {view === "customer"
              ? <CustomerView
                  isMobile={isMobile}
                  onFreezeRequest={handleFreezeRequest}
                  onPurchaseFreeze={(stopped) => executeFreeze(stopped, UNAUTHORIZED_PURCHASE_PATTERN_AR)}
                  onPurchaseBlocked={handlePurchaseBlocked}
                />
              : <BankView
                  isMobile={isMobile}
                  injectedCase={frozenCase}
                  caseToOpen={caseToOpen}
                  onCaseOpened={() => setCaseToOpen(null)}
                />
            }
          </div>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  const { isAuthenticated } = useApp();
  // isMobile is computed once here and threaded down as a prop (never via
  // context), so both the login screen and the app shell share one source.
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  if (!isAuthenticated) return <LoginView isMobile={isMobile} />;
  return <AppShell isMobile={isMobile} />;
}
