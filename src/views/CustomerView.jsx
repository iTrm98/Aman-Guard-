import { useState } from "react";
import Hero from "../components/customer/Hero";
import CallVerification from "../components/customer/CallVerification";
import ScamChecker from "../components/customer/ScamChecker";
import RiskReport from "../components/customer/RiskReport";

export default function CustomerView({ onShowModal, onFreezeRequest }) {
  const [analysisResult, setAnalysisResult] = useState(null);

  function handleValidationError() {
    onShowModal({
      title: "خطأ في الإدخال",
      message: "الرجاء إدخال نص الرسالة أو الرابط المراد فحصه أولاً.",
      type: "info",
    });
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <Hero />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <CallVerification />
        <ScamChecker onResult={setAnalysisResult} onValidationError={handleValidationError} />
      </div>

      {analysisResult && <RiskReport result={analysisResult} onFreezeRequest={onFreezeRequest} />}
    </div>
  );
}
