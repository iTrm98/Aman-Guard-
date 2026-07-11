import { useState } from "react";
import { ScanText, Sparkles, Loader2 } from "lucide-react";
import { analyzeText } from "../../api/fraudService";
import { useApp } from "../../context/useApp";

export default function ScamChecker({ onResult, onValidationError }) {
  const { t } = useApp();
  const [text,      setText]      = useState("");
  const [loading,   setLoading]   = useState(false);
  const [hasResult, setHasResult] = useState(false);
  const [error,     setError]     = useState(null);

  async function handleAnalyze() {
    if (!text.trim()) { onValidationError?.(); return; }
    setLoading(true); setError(null);
    try {
      const result = await analyzeText(text);
      onResult?.(result); setHasResult(true);
    } catch (err) {
      setError(err?.status === 429 ? t("rate_limit_exceeded") : t("data_load_error"));
    } finally { setLoading(false); }
  }

  return (
    <div className="card" style={{ padding:20, display:"flex", flexDirection:"column", gap:16 }}>
      <div style={{ display:"flex", alignItems:"flex-start", gap:12 }}>
        <div style={{ width:40, height:40, borderRadius:12, background:"rgba(196,154,90,0.1)", border:"1px solid rgba(196,154,90,0.2)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
          <ScanText style={{ width:18, height:18, color:"var(--gold)" }} />
        </div>
        <div>
          <h3 style={{ fontWeight:900, fontSize:15, color:"var(--text-primary)", marginBottom:4 }}>{t("scam_title")}</h3>
          <p style={{ fontSize:13, color:"var(--text-muted)", lineHeight:1.5 }}>{t("scam_desc")}</p>
        </div>
      </div>

      <div style={{ height:1, background:"var(--border-subtle)" }} />

      <div style={{ position:"relative" }}>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value.slice(0, 500))}
          rows={4}
          placeholder={t("scam_placeholder")}
          className="input-field"
          style={{ resize:"none", paddingBottom:28 }}
        />
        <span style={{ position:"absolute", bottom:10, insetInlineStart:14, fontSize:11, color: text.length > 450 ? "var(--red)" : "var(--text-muted)" }}>
          {text.length} / 500
        </span>
      </div>

      {loading && (
        <div style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 14px", borderRadius:10, background:"rgba(196,154,90,0.07)", border:"1px solid rgba(196,154,90,0.15)", fontSize:13, color:"#8a6030" }}>
          <Loader2 style={{ width:16, height:16, flexShrink:0, color:"var(--gold)" }} className="animate-spin" />
          {t("analyzing")}
        </div>
      )}

      {error && <p style={{ fontSize:12, textAlign:"center", color:"var(--red)" }}>{error}</p>}

      <button onClick={handleAnalyze} disabled={loading || !text.trim()} className="btn-primary" style={{ width:"100%" }}>
        <Sparkles style={{ width:16, height:16 }} />
        {hasResult ? t("analyze_another") : t("analyze_ai")}
      </button>
    </div>
  );
}
