import { useState } from "react";
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

function AppShell() {
  const { modal, closeModal, showModal, panel, closePanel, t, lang, currentUser } = useApp();
  // Role owns the view: officers get the SOC dashboard, customers the portal.
  // Deriving it (rather than useState) means there is no runtime switch that
  // could ever put a customer on the bank dashboard or vice-versa — the backend
  // enforces the same split.
  const view = currentUser.role === "BANK_OFFICER" ? "bank" : "customer";
  const [frozenCase,    setFrozenCase]    = useState(null);
  const [caseToOpen,    setCaseToOpen]    = useState(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

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

      <Sidebar
        view={view}
        onSwitchView={() => { /* view is role-derived; nav is a single fixed item */ }}
        mobileOpen={mobileNavOpen}
        onCloseMobile={() => setMobileNavOpen(false)}
      />

      <div style={{ display:"flex", flexDirection:"column", flex:1, minWidth:0, overflow:"hidden" }}>
        <Topbar view={view} onOpenMobileNav={() => setMobileNavOpen(true)} />
        <main className="p-4 sm:p-5 md:p-7" style={{ flex:1, overflowY:"auto", background:"var(--bg-app)", transition:"background 0.25s" }}>
          <div style={{ maxWidth:1080, margin:"0 auto" }}>
            {view === "customer"
              ? <CustomerView
                  onFreezeRequest={handleFreezeRequest}
                  onPurchaseFreeze={(stopped) => executeFreeze(stopped, UNAUTHORIZED_PURCHASE_PATTERN_AR)}
                  onPurchaseBlocked={handlePurchaseBlocked}
                />
              : <BankView
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
  if (!isAuthenticated) return <LoginView />;
  return <AppShell />;
}
