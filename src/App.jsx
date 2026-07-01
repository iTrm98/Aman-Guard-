import { useState } from "react";
import Sidebar from "./components/layout/Sidebar";
import Topbar  from "./components/layout/Topbar";
import Modal   from "./components/layout/Modal";
import CustomerView from "./views/CustomerView";
import BankView     from "./views/BankView";
import { freezeAccount } from "./api/fraudService";

const initialModal = {
  open: false, title: "", message: "",
  type: "info", showCancel: false, confirmText: "حسناً", onConfirm: null,
};

export default function App() {
  const [view,       setView]       = useState("customer");
  const [modal,      setModal]      = useState(initialModal);
  const [frozenCase, setFrozenCase] = useState(null);

  const showModal = (config) => setModal({ ...initialModal, open: true, ...config });
  const closeModal= () => setModal((p) => ({ ...p, open: false }));

  function handleFreezeRequest(caseId) {
    showModal({
      title: "تأكيد التجميد الطارئ",
      message: "سيتم إيقاف جميع الحوالات الصادرة وعمليات الشراء الإلكتروني فوراً، ورفع بلاغ رسمي لإدارة مكافحة الاحتيال. هل تؤكد؟",
      type: "danger",
      showCancel: true,
      confirmText: "نعم، جمّد الحساب الآن",
      onConfirm: () => executeFreeze(caseId),
    });
  }

  async function executeFreeze(caseId) {
    const res = await freezeAccount({ caseId, reason: "customer_initiated" });
    showModal({
      title: "تم التجميد بنجاح",
      message: `تم تجميد حسابك احترازياً. البلاغ رقم #${res.reportNumber} قيد المعالجة من قِبل فريق الأمن المالي. سيتواصلون معك خلال ساعة.`,
      type: "success",
      confirmText: "الانتقال للوحة البنك",
      onConfirm: () => {
        setFrozenCase({
          id: res.reportNumber,
          timeAgo: "الآن",
          customerName: "نواف العتيبي",
          fraudPattern: "احتيال OTP عبر الهندسة الاجتماعية",
          riskScore: 95,
          riskLevel: "critical",
          accountStatus: "frozen",
        });
        setView("bank");
      },
    });
  }

  return (
    <div className="flex h-screen overflow-hidden" dir="rtl">
      <Modal {...modal} onClose={closeModal} />

      {/* Sidebar */}
      <Sidebar view={view} onSwitchView={setView} />

      {/* Main content column */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Topbar view={view} />

        <main className="flex-1 overflow-y-auto p-5 lg:p-7" style={{ background: "#f5f7fa" }}>
          <div style={{ maxWidth: 1080, margin: "0 auto" }}>
            {view === "customer"
              ? <CustomerView onShowModal={showModal} onFreezeRequest={handleFreezeRequest} />
              : <BankView injectedCase={frozenCase} />
            }
          </div>
        </main>
      </div>
    </div>
  );
}
