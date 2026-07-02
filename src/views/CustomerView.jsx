import { useState } from "react";
import AccountCard    from "../components/customer/AccountCard";
import CallVerification from "../components/customer/CallVerification";
import ScamChecker    from "../components/customer/ScamChecker";
import RiskReport     from "../components/customer/RiskReport";
import PurchaseCheckout from "../components/customer/PurchaseCheckout";
import { useApp }     from "../context/useApp";

export default function CustomerView({ onFreezeRequest, onPurchaseFreeze, onPurchaseBlocked }) {
  const { t, showModal } = useApp();
  const [analysisResult, setAnalysisResult] = useState(null);

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:18 }} className="animate-fade-in">
      <AccountCard />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        <CallVerification />
        <ScamChecker
          onResult={setAnalysisResult}
          onValidationError={() => showModal({ title:t("field_required_title"), message:t("field_required_msg"), type:"info" })}
        />
      </div>
      {analysisResult && <RiskReport result={analysisResult} onFreezeRequest={onFreezeRequest} />}
      <PurchaseCheckout onPurchaseFreeze={onPurchaseFreeze} onPurchaseBlocked={onPurchaseBlocked} />
    </div>
  );
}
