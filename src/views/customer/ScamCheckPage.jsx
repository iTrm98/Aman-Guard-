import { useState } from "react";
import PageHeader  from "../../components/layout/PageHeader";
import ScamChecker from "../../components/customer/ScamChecker";
import RiskReport  from "../../components/customer/RiskReport";
import { useApp } from "../../context/useApp";

export default function ScamCheckPage({ isMobile, onFreezeRequest }) {
  const { t, showModal } = useApp();
  const [analysisResult, setAnalysisResult] = useState(null);

  return (
    <div className="animate-fade-in" style={{ display:"flex", flexDirection:"column", gap:18, overflowX:"hidden" }}>
      <PageHeader icon="🔍" titleKey="page_scam_check" descKey="page_scam_check_desc" isMobile={isMobile} />
      <ScamChecker
        isMobile={isMobile}
        onResult={setAnalysisResult}
        onValidationError={() => showModal({ title:t("field_required_title"), message:t("field_required_msg"), type:"info" })}
      />
      {analysisResult && <RiskReport result={analysisResult} onFreezeRequest={onFreezeRequest} />}
    </div>
  );
}
