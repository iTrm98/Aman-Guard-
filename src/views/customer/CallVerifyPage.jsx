import PageHeader       from "../../components/layout/PageHeader";
import CallVerification from "../../components/customer/CallVerification";

export default function CallVerifyPage({ isMobile }) {
  return (
    <div className="animate-fade-in" style={{ display:"flex", flexDirection:"column", overflowX:"hidden" }}>
      <PageHeader icon="📞" titleKey="page_call_verify" descKey="page_call_verify_desc" isMobile={isMobile} />
      <div style={{ width:"100%", maxWidth: isMobile ? "100%" : 600, marginInline:"auto" }}>
        <CallVerification />
      </div>
    </div>
  );
}
