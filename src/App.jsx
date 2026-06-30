import { useState } from "react";
import Navbar from "./components/layout/Navbar";
import Modal from "./components/layout/Modal";
import CustomerView from "./views/CustomerView";
import BankView from "./views/BankView";
import { freezeAccount } from "./api/fraudService";

const initialModalState = {
  open: false,
  title: "",
  message: "",
  type: "info",
  showCancel: false,
  confirmText: "حسناً",
  onConfirm: null,
};

function App() {
  const [view, setView] = useState("customer");
  const [modal, setModal] = useState(initialModalState);
  const [frozenCase, setFrozenCase] = useState(null);

  function showModal(config) {
    setModal({ ...initialModalState, open: true, ...config });
  }

  function closeModal() {
    setModal((prev) => ({ ...prev, open: false }));
  }

  function handleFreezeRequest(caseId) {
    showModal({
      title: "تأكيد التجميد الطارئ",
      message:
        "هل أنت متأكد من تجميد الحساب؟ سيتم إيقاف جميع الحوالات الصادرة وعمليات الشراء الإلكتروني فوراً ورفع بلاغ لإدارة مكافحة الاحتيال.",
      type: "danger",
      showCancel: true,
      confirmText: "نعم، قم بتجميد الحساب",
      onConfirm: () => executeFreeze(caseId),
    });
  }

  async function executeFreeze(caseId) {
    const response = await freezeAccount({ caseId, reason: "customer_initiated" });

    showModal({
      title: "تم التجميد بنجاح",
      message: `تم تجميد حسابك احترازياً لحماية أموالك. تم تحويل البلاغ رقم #${response.reportNumber} لفريق مكافحة الاحتيال، سيقومون بالتواصل معك قريباً.`,
      type: "success",
      confirmText: "الانتقال للوحة البنك (للعرض)",
      onConfirm: () => {
        setFrozenCase({
          id: response.reportNumber,
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
    <div className="text-gray-800 flex flex-col min-h-screen">
      <Modal {...modal} onClose={closeModal} />
      <Navbar view={view} onSwitchView={setView} />

      <main className="flex-grow w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        {view === "customer" ? (
          <CustomerView onShowModal={showModal} onFreezeRequest={handleFreezeRequest} />
        ) : (
          <BankView injectedCase={frozenCase} />
        )}
      </main>
    </div>
  );
}

export default App;
