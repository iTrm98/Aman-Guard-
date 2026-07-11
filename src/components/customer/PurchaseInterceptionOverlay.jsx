import { useState } from "react";
import { Hand, Check, Ban, Loader2 } from "lucide-react";
import { confirmTransaction, cancelTransaction } from "../../api/fraudService";
import { apiErrorMessage } from "../../api/client";
import { useApp } from "../../context/useApp";

// Full-screen security interception overlay (prototype: interceptionModal).
// Shown ONLY for medium-risk (suspended) transactions — high/critical are
// blocked server-side with zero customer override and never reach this UI.
// zIndex 70 sits above the modal system (60) and panel drawers (50).
export default function PurchaseInterceptionOverlay({ isMobile, transaction, onConfirmed, onStopped }) {
  const { t, lang } = useApp();
  const [busy,  setBusy]  = useState(null); // "confirm" | "cancel" | null
  const [error, setError] = useState(null);

  const finding = transaction.findings?.[0];
  const suspicionReason = finding
    ? (lang === "en" && finding.titleEn ? finding.titleEn : finding.titleAr)
    : "";

  async function handleYes() {
    setBusy("confirm"); setError(null);
    try {
      await confirmTransaction(transaction.transactionId);
      onConfirmed?.();
    } catch (err) {
      setError(apiErrorMessage(err, t("data_load_error")));
      setBusy(null);
    }
  }

  async function handleNo() {
    setBusy("cancel"); setError(null);
    try {
      const res = await cancelTransaction(transaction.transactionId);
      onStopped?.(res.caseId);
    } catch (err) {
      setError(apiErrorMessage(err, t("data_load_error")));
      setBusy(null);
    }
  }

  return (
    <div style={{
      position:"fixed", inset:0, zIndex:70,
      display:"flex", alignItems:"center", justifyContent:"center", padding:16,
      background:"rgba(127,29,29,0.9)", backdropFilter:"blur(8px)",
    }}>
      <div className="animate-slide-up" style={{ width:"min(480px,94vw)", borderRadius:20, overflow:"hidden", boxShadow:"var(--shadow-modal)" }}>

        {/* Header — red */}
        <div style={{ background:"var(--red)", padding:"28px 24px 22px", textAlign:"center" }}>
          <div style={{
            width:64, height:64, borderRadius:"50%", background:"#fff",
            display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 14px",
            animation:"pulseSoft 1.5s ease-in-out infinite",
          }}>
            <Hand style={{ width:30, height:30, color:"var(--red)" }} />
          </div>
          <p style={{ fontWeight:900, fontSize: isMobile ? 17 : 19, color:"#fff", marginBottom:6 }}>{t("interception_title")}</p>
          <p style={{ fontSize:13, lineHeight:1.6, color:"rgba(255,255,255,0.85)" }}>{t("interception_sub")}</p>
        </div>

        {/* Body — gray */}
        <div style={{ background:"var(--bg-subtle)", padding:24 }}>
          <p style={{ fontSize:14.5, fontWeight:900, textAlign:"center", color:"var(--text-primary)", marginBottom:16 }}>
            {t("interception_question")}
          </p>

          <div style={{ background:"var(--bg-surface)", border:"1px solid var(--border)", borderRadius:12, padding:16, display:"flex", flexDirection:"column", gap:12, marginBottom:16 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", gap:12 }}>
              <span style={{ fontSize:12.5, color:"var(--text-muted)", fontWeight:700 }}>{t("merchant_label")}</span>
              <span style={{ fontSize:13.5, fontWeight:700, color:"var(--text-primary)" }}>{transaction.merchantName}</span>
            </div>
            <div style={{ height:1, background:"var(--border-subtle)" }} />
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", gap:12 }}>
              <span style={{ fontSize:12.5, color:"var(--text-muted)", fontWeight:700 }}>{t("amount")}</span>
              <span style={{ fontSize:16, fontWeight:900, color:"var(--red)", direction:"ltr", unicodeBidi:"embed" }}>
                {Number(transaction.amount).toLocaleString(lang === "en" ? "en-US" : "ar-SA")}
              </span>
            </div>
            {suspicionReason && (
              <>
                <div style={{ height:1, background:"var(--border-subtle)" }} />
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", gap:12 }}>
                  <span style={{ fontSize:12.5, color:"var(--text-muted)", fontWeight:700 }}>{t("suspicion_reason")}</span>
                  <span style={{ fontSize:12, fontWeight:800, padding:"4px 10px", borderRadius:999, color:"#b45309", background:"rgba(217,119,6,0.12)", border:"1px solid rgba(217,119,6,0.3)" }}>
                    {suspicionReason}
                  </span>
                </div>
              </>
            )}
          </div>

          {error && <p style={{ fontSize:12, textAlign:"center", color:"var(--red)", marginBottom:12 }}>{error}</p>}

          {/* RTL: first button renders on the right (yes), second on the left (no) */}
          <div style={{ display:"flex", flexDirection: isMobile ? "column" : "row", gap:10 }}>
            <button onClick={handleYes} disabled={busy !== null} className="btn-ghost" style={{ flex:1 }}>
              {busy === "confirm"
                ? <Loader2 style={{ width:15, height:15 }} className="animate-spin" />
                : <Check style={{ width:15, height:15 }} />
              }
              {t("interception_yes")}
            </button>
            <button onClick={handleNo} disabled={busy !== null} className="btn-danger" style={{ flex:1 }}>
              {busy === "cancel"
                ? <Loader2 style={{ width:15, height:15 }} className="animate-spin" />
                : <Ban style={{ width:15, height:15 }} />
              }
              {t("interception_no")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
