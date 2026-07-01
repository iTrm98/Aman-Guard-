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
  const { modal, closeModal, showModal, panel, closePanel, t } = useApp();
  const [view,       setView]       = useState("customer");
  const [frozenCase, setFrozenCase] = useState(null);

  function handleFreezeRequest(caseId) {
    showModal({
      title:      t("freeze_confirm_title"),
      message:    t("freeze_confirm_msg"),
      type:       "danger",
      showCancel: true,
      confirmText:t("freeze_confirm_btn"),
      onConfirm:  () => executeFreeze(caseId),
    });
  }

  async function executeFreeze(caseId) {
    const res = await freezeAccount({ caseId, reason:"customer_initiated" });
    showModal({
      title:      t("freeze_success_title"),
      message:    t("freeze_success_msg", { n: res.reportNumber }),
      type:       "success",
      confirmText:t("goto_bank"),
      onConfirm: () => {
        setFrozenCase({
          id:            res.reportNumber,
          timeAgo:       t("lang") === "en" ? "Just now" : "الآن",
          customerName:  "نواف العتيبي",
          fraudPattern:  "احتيال OTP عبر الهندسة الاجتماعية",
          riskScore:     95,
          riskLevel:     "critical",
          accountStatus: "frozen",
        });
        setView("bank");
      },
    });
  }

  return (
    <div style={{ display:"flex", height:"100vh", overflow:"hidden" }}>
      <Modal {...modal} onClose={closeModal} />

      {panel?.type === "notifications" && <NotificationsPanel onClose={closePanel} />}
      {panel?.type === "settings"      && <SettingsPanel      onClose={closePanel} />}

      <Sidebar view={view} onSwitchView={setView} />

      <div style={{ display:"flex", flexDirection:"column", flex:1, minWidth:0, overflow:"hidden" }}>
        <Topbar view={view} />
        <main style={{ flex:1, overflowY:"auto", padding:"20px 28px", background:"var(--bg-app)", transition:"background 0.25s" }}>
          <div style={{ maxWidth:1080, margin:"0 auto" }}>
            {view === "customer"
              ? <CustomerView onFreezeRequest={handleFreezeRequest} />
              : <BankView     injectedCase={frozenCase} />
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
