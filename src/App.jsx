import { useState } from "react";
import Sidebar    from "./components/layout/Sidebar";
import Topbar     from "./components/layout/Topbar";
import Modal      from "./components/layout/Modal";
import NotificationsPanel from "./components/layout/NotificationsPanel";
import SettingsPanel      from "./components/layout/SettingsPanel";
import CustomerView from "./views/CustomerView";
import BankView     from "./views/BankView";
import { freezeAccount } from "./api/fraudService";
import { useApp } from "./context/useApp";

function AppShell() {
  const { modal, closeModal, showModal, panel, closePanel, t, lang, currentUser } = useApp();
  const [view,          setView]          = useState("customer");
  const [frozenCase,    setFrozenCase]    = useState(null);
  const [caseToOpen,    setCaseToOpen]    = useState(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  function handleOpenCaseFromNotification(caseId) {
    closePanel();
    setView("bank");
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

  async function executeFreeze(analysisResult) {
    const res = await freezeAccount({ caseId: analysisResult?.caseId, reason:"customer_initiated" });
    showModal({
      title:      t("freeze_success_title"),
      message:    t("freeze_success_msg", { n: res.reportNumber }),
      type:       "success",
      confirmText:t("goto_bank"),
      onConfirm: () => {
        const accountStatus = res.status === "pending" ? "partially_restricted" : "frozen";
        setFrozenCase({
          id:            res.reportNumber,
          createdAt:     new Date().toISOString(),
          customerName:  lang === "en" ? currentUser.nameEn : currentUser.name,
          fraudPattern:  analysisResult?.findings?.[0]?.titleAr ?? analysisResult?.riskLabelAr,
          riskScore:     analysisResult?.riskScore ?? 0,
          riskLevel:     analysisResult?.riskLevel ?? "high",
          accountStatus,
        });
        setView("bank");
      },
    });
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Modal {...modal} onClose={closeModal} />

      {panel?.type === "notifications" && (
        <NotificationsPanel onClose={closePanel} onOpenCase={handleOpenCaseFromNotification} />
      )}
      {panel?.type === "settings"      && <SettingsPanel      onClose={closePanel} />}

      <Sidebar
        view={view}
        onSwitchView={setView}
        mobileOpen={mobileNavOpen}
        onCloseMobile={() => setMobileNavOpen(false)}
      />

      <div style={{ display:"flex", flexDirection:"column", flex:1, minWidth:0, overflow:"hidden" }}>
        <Topbar view={view} onOpenMobileNav={() => setMobileNavOpen(true)} />
        <main className="p-4 sm:p-5 md:p-7" style={{ flex:1, overflowY:"auto", background:"var(--bg-app)", transition:"background 0.25s" }}>
          <div style={{ maxWidth:1080, margin:"0 auto" }}>
            {view === "customer"
              ? <CustomerView onFreezeRequest={handleFreezeRequest} />
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
  return <AppShell />;
}
