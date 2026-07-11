import { useState } from "react";
import { PhoneCall, RefreshCw, ShieldX, ShieldCheck, Loader2 } from "lucide-react";
import { checkCallStatus } from "../../api/fraudService";
import { apiErrorMessage } from "../../api/client";
import { useApp } from "../../context/useApp";

export default function CallVerification() {
  const { t } = useApp();
  const [status, setStatus] = useState("idle");
  const [result, setResult] = useState(null);
  const [error,  setError]  = useState(null);

  async function handleCheck() {
    setStatus("loading"); setError(null);
    try {
      const data = await checkCallStatus();
      setResult(data); setStatus("done");
    } catch (err) {
      setError(apiErrorMessage(err, t("verify_error"))); setStatus("idle");
    }
  }

  const isUnsafe = status === "done" && result && !result.hasActiveOfficialCall;

  return (
    <div className="card" style={{ padding:20, display:"flex", flexDirection:"column", gap:16 }}>
      <div style={{ display:"flex", alignItems:"flex-start", gap:12 }}>
        <div style={{ width:40, height:40, borderRadius:12, background:"rgba(26,90,154,0.1)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
          <PhoneCall style={{ width:18, height:18, color:"#1a5a9a" }} />
        </div>
        <div>
          <h3 style={{ fontWeight:900, fontSize:15, color:"var(--text-primary)", marginBottom:4 }}>{t("call_title")}</h3>
          <p style={{ fontSize:13, color:"var(--text-muted)", lineHeight:1.5 }}>{t("call_desc")}</p>
        </div>
      </div>

      <div style={{ height:1, background:"var(--border-subtle)" }} />

      {status === "done" && result && (
        <div style={{ borderRadius:12, padding:14, display:"flex", gap:12, background: isUnsafe ? "rgba(192,57,43,0.08)" : "rgba(26,122,74,0.08)", border:`1.5px solid ${isUnsafe ? "rgba(192,57,43,0.25)" : "rgba(26,122,74,0.25)"}` }}>
          {isUnsafe
            ? <ShieldX  style={{ width:18, height:18, color:"var(--red)",   flexShrink:0, marginTop:1 }} />
            : <ShieldCheck style={{ width:18, height:18, color:"var(--green)", flexShrink:0, marginTop:1 }} />
          }
          <div>
            <p style={{ fontSize:13, fontWeight:900, marginBottom:4, color: isUnsafe ? "var(--red)" : "var(--green)" }}>
              {isUnsafe ? t("call_warning_title") : t("call_ok_title")}
            </p>
            <p style={{ fontSize:12, lineHeight:1.6, color:"var(--text-secondary)" }}>{result.message}</p>
          </div>
        </div>
      )}

      {error && <p style={{ fontSize:12, textAlign:"center", color:"var(--red)" }}>{error}</p>}

      <button onClick={handleCheck} disabled={status === "loading"} className="btn-primary" style={{ width:"100%", ...(status === "done" && !isUnsafe ? { background:"var(--green)" } : {}) }}>
        {status === "loading"
          ? <><Loader2 style={{ width:16, height:16 }} className="animate-spin" />{t("verifying")}</>
          : status === "done"
            ? <><RefreshCw style={{ width:16, height:16 }} />{t("re_verify")}</>
            : <><PhoneCall style={{ width:16, height:16 }} />{t("verify_now")}</>
        }
      </button>
    </div>
  );
}
