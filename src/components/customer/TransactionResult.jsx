import { CheckCircle2, Ban, RotateCcw } from "lucide-react";
import { useApp } from "../../context/useApp";

// Post-analysis outcome card. Two terminal states:
//   allowed  → green confirmation + "try another"
//   blocked  → red final notice (high/critical) — zero override, no continue
// Suspended (medium) transactions never render here; they go through
// PurchaseInterceptionOverlay instead.
export default function TransactionResult({ result, onReset }) {
  const { t, lang } = useApp();

  const pick = (ar, en) => (lang === "en" && en ? en : ar);

  if (result.action === "allowed") {
    return (
      <div className="animate-fade-in" style={{ borderRadius:12, padding:16, display:"flex", gap:12, background:"rgba(26,122,74,0.08)", border:"1.5px solid rgba(26,122,74,0.25)" }}>
        <CheckCircle2 style={{ width:20, height:20, color:"var(--green)", flexShrink:0, marginTop:1 }} />
        <div style={{ flex:1 }}>
          <p style={{ fontSize:14, fontWeight:900, marginBottom:4, color:"var(--green)" }}>{t("tx_allowed_title")}</p>
          <p style={{ fontSize:12.5, lineHeight:1.6, color:"var(--text-secondary)", marginBottom:12 }}>{t("tx_allowed_desc")}</p>
          <button onClick={onReset} className="btn-ghost" style={{ fontSize:12.5 }}>
            <RotateCcw style={{ width:14, height:14 }} />
            {t("another_transaction")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in" style={{ borderRadius:12, padding:16, display:"flex", gap:12, background:"rgba(192,57,43,0.08)", border:"1.5px solid rgba(192,57,43,0.3)" }}>
      <Ban style={{ width:20, height:20, color:"var(--red)", flexShrink:0, marginTop:1 }} />
      <div style={{ flex:1 }}>
        <p style={{ fontSize:14, fontWeight:900, marginBottom:4, color:"var(--red)" }}>{t("tx_blocked_title")}</p>
        <p style={{ fontSize:12.5, lineHeight:1.6, color:"var(--text-secondary)", marginBottom:10 }}>{t("tx_blocked_desc")}</p>

        <ul style={{ display:"flex", flexDirection:"column", gap:8, marginBottom:12 }}>
          {(result.findings ?? []).map((f, i) => (
            <li key={i} style={{ fontSize:12, lineHeight:1.6, color:"var(--text-secondary)", paddingInlineStart:14, position:"relative" }}>
              <span style={{ position:"absolute", insetInlineStart:0, top:7, width:6, height:6, borderRadius:"50%", background:"var(--red)" }} />
              <strong style={{ color:"var(--text-primary)" }}>{pick(f.titleAr, f.titleEn)}</strong>
              {" — "}{pick(f.detailAr, f.detailEn)}
            </li>
          ))}
        </ul>

        {result.reportNumber && (
          <p style={{ fontSize:12.5, fontWeight:700, color:"var(--text-primary)", marginBottom:8 }}>
            {t("case_id")}: <span style={{ direction:"ltr", unicodeBidi:"embed" }}>#{result.reportNumber}</span>
          </p>
        )}

        <p style={{ fontSize:12, fontStyle:"italic", lineHeight:1.6, color:"var(--text-muted)", marginBottom:12 }}>
          {t("tx_blocked_notified")}
        </p>

        <button onClick={onReset} className="btn-ghost" style={{ fontSize:12.5 }}>
          <RotateCcw style={{ width:14, height:14 }} />
          {t("back_home")}
        </button>
      </div>
    </div>
  );
}
