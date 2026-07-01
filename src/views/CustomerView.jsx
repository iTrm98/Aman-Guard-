import { useState } from "react";
import AccountCard from "../components/customer/AccountCard";
import CallVerification from "../components/customer/CallVerification";
import ScamChecker from "../components/customer/ScamChecker";
import RiskReport from "../components/customer/RiskReport";

export default function CustomerView({ onShowModal, onFreezeRequest }) {
  const [analysisResult, setAnalysisResult] = useState(null);

  function handleValidationError() {
    onShowModal({
      title: "حقل مطلوب",
      message: "الرجاء لصق نص الرسالة أو الرابط المراد فحصه في الحقل أولاً.",
      type: "info",
    });
  }

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Account card spans full width */}
      <AccountCard />

      {/* Two tool cards side by side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <CallVerification />
        <ScamChecker onResult={setAnalysisResult} onValidationError={handleValidationError} />
      </div>

      {/* AI report appears below when ready */}
      {analysisResult && (
        <RiskReport result={analysisResult} onFreezeRequest={onFreezeRequest} />
      )}
    </div>
  );
}
