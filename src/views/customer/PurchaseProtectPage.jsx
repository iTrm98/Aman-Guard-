import PageHeader       from "../../components/layout/PageHeader";
import PurchaseCheckout from "../../components/customer/PurchaseCheckout";
import { useApp } from "../../context/useApp";

// The 3-step flow mirrors the backend gating: analyze → suspend on suspicion
// → block on confirmed fraud. Colors reuse the existing risk palette.
const STEPS = [
  { n: 1, key: "step_analyze", color: "var(--gold)", bg: "rgba(151,132,226,0.12)" },
  { n: 2, key: "step_suspend", color: "#d35400",     bg: "rgba(211,84,0,0.12)"    },
  { n: 3, key: "step_block",   color: "var(--red)",  bg: "rgba(192,57,43,0.12)"   },
];

export default function PurchaseProtectPage({ isMobile, onPurchaseFreeze, onPurchaseBlocked }) {
  const { t } = useApp();

  return (
    <div className="animate-fade-in" style={{ display:"flex", flexDirection:"column", gap:18, overflowX:"hidden" }}>
      <PageHeader icon="🛒" titleKey="page_purchase_protect" descKey="page_purchase_protect_desc" isMobile={isMobile} />

      {/* How the protection works */}
      <div className="card" style={{ padding: isMobile ? 14 : 20 }}>
        <p style={{ fontSize:14, fontWeight:900, color:"var(--text-primary)", marginBottom:14 }}>{t("how_it_works")}</p>
        <div className="customer-page-grid-3" style={{ display:"grid", gridTemplateColumns:"repeat(3, 1fr)", gap:12 }}>
          {STEPS.map((s) => (
            <div key={s.key} style={{ display:"flex", alignItems:"flex-start", gap:10, padding:12, borderRadius:10, background:"var(--bg-subtle)", border:"1px solid var(--border-subtle)" }}>
              <span style={{
                width:28, height:28, borderRadius:"50%", flexShrink:0,
                display:"flex", alignItems:"center", justifyContent:"center",
                fontSize:13, fontWeight:900, color:s.color, background:s.bg,
              }}>
                {s.n}
              </span>
              <span style={{ fontSize:12.5, lineHeight:1.5, color:"var(--text-secondary)", fontWeight:600, marginTop:4 }}>{t(s.key)}</span>
            </div>
          ))}
        </div>
      </div>

      <PurchaseCheckout
        isMobile={isMobile}
        onPurchaseFreeze={onPurchaseFreeze}
        onPurchaseBlocked={onPurchaseBlocked}
      />
    </div>
  );
}
