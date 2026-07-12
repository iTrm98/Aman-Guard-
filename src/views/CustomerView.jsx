import OverviewPage        from "./customer/OverviewPage";
import CallVerifyPage      from "./customer/CallVerifyPage";
import ScamCheckPage       from "./customer/ScamCheckPage";
import PurchaseProtectPage from "./customer/PurchaseProtectPage";
import AccountPage         from "./customer/AccountPage";
import EmergencyFreezePage from "./customer/EmergencyFreezePage";

// Pure page router for the customer portal. customerPage state lives in
// App.jsx (AppShell); the sidebar sub-nav, topbar search dropdown, and the
// overview quick-action cards all navigate through the same onNavigate.
export default function CustomerView({ customerPage, onNavigate, isMobile, onFreezeRequest, onPurchaseFreeze, onPurchaseBlocked }) {
  const pages = {
    "overview":         <OverviewPage isMobile={isMobile} onNavigate={onNavigate} onFreezeRequest={onFreezeRequest} />,
    "call-verify":      <CallVerifyPage isMobile={isMobile} />,
    "scam-check":       <ScamCheckPage isMobile={isMobile} onFreezeRequest={onFreezeRequest} />,
    "purchase-protect": <PurchaseProtectPage isMobile={isMobile} onPurchaseFreeze={onPurchaseFreeze} onPurchaseBlocked={onPurchaseBlocked} />,
    "account":          <AccountPage isMobile={isMobile} />,
    "emergency-freeze": <EmergencyFreezePage isMobile={isMobile} onFreezeRequest={onFreezeRequest} />,
  };
  return pages[customerPage] ?? pages["overview"];
}
