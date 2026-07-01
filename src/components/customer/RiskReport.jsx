import { useState } from "react";
import { AlertTriangle, XCircle, Snowflake, CheckSquare, Square, ChevronDown, ChevronUp } from "lucide-react";
import { useApp } from "../../context/AppContext";

function RiskGauge({ score }) {
  const r = 44, circumference = Math.PI * r;
  const dashOffset = circumference * (1 - score / 100);
  const color = score >= 80 ? "var(--red)" : score >= 50 ? "#d35400" : "var(--gold)";
  return (
    <svg width={112} height={72} viewBox="0 0 112 72" fill="none">
      <path d={`M 12 58 A ${r} ${r} 0 0 1 100 58`} stroke="var(--border)" strokeWidth={8} strokeLinecap="round" fill="none" />
      <path d={`M 12 58 A ${r} ${r} 0 0 1 100 58`} stroke={color} strokeWidth={8} strokeLinecap="round" fill="none"
        strokeDasharray={circumference} strokeDashoffset={dashOffset}
        style={{ transition:"stroke-dashoffset 0.8s ease" }} />
      <text x={56} y={54} textAnchor="middle" fontSize={22} fontWeight={900} fill={color} fontFamily="Tajawal,Inter,sans-serif">{score}</text>
      <text x={56} y={66} textAnchor="middle" fontSize={9} fill="var(--text-muted)" fontFamily="Tajawal,Inter,sans-serif">/ 100</text>
    </svg>
  );
}

export default function RiskReport({ result, onFreezeRequest }) {
  const { t } = useApp();
  const [answers,  setAnswers]  = useState({});
  const [expanded, setExpanded] = useState(true);
  if (!result) return null;

  const score = result.riskScore;
  const riskColor  = score >= 80 ? "var(--red)" : score >= 50 ? "#d35400" : "var(--gold)";
  const riskBg     = score >= 80 ? "rgba(192,57,43,0.08)"  : score >= 50 ? "rgba(211,84,0,0.08)"  : "rgba(196,154,90,0.08)";
  const riskBorder = score >= 80 ? "rgba(192,57,43,0.25)"  : score >= 50 ? "rgba(211,84,0,0.25)"  : "rgba(196,154,90,0.25)";

  return (
    <div style={{ borderRadius:16, overflow:"hidden", border:`1.5px solid ${riskBorder}`, background:"var(--bg-surface)" }} className="animate-slide-up">
      {/* Header */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"14px 20px", background:riskBg, borderBottom:`1px solid ${riskBorder}` }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <AlertTriangle style={{ width:18, height:18, color:riskColor }} />
          <div>
            <p style={{ fontWeight:900, fontSize:15, color:riskColor }}>{t("report_title")}</p>
            <p style={{ fontSize:11, color:"var(--text-muted)", marginTop:2 }}>{t("report_issued")}</p>
          </div>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          <div style={{ textAlign:"center" }}>
            <RiskGauge score={score} />
            <p style={{ fontSize:11, fontWeight:900, color:riskColor, marginTop:-4 }}>{result.riskLabel}</p>
          </div>
          <button onClick={() => setExpanded(v => !v)} style={{ padding:7, borderRadius:8, background:"rgba(0,0,0,0.08)", border:"none", cursor:"pointer", color:"var(--text-muted)" }}>
            {expanded ? <ChevronUp style={{ width:16, height:16 }} /> : <ChevronDown style={{ width:16, height:16 }} />}
          </button>
        </div>
      </div>

      {expanded && (
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20, padding:20 }}>
          {/* Findings */}
          <div>
            <p style={{ fontSize:11, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.08em", color:"var(--text-muted)", marginBottom:12 }}>{t("report_findings")}</p>
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              {result.findings.map((f) => (
                <div key={f.title} style={{ display:"flex", gap:10, padding:12, borderRadius:10, background:"rgba(192,57,43,0.06)", border:"1px solid rgba(192,57,43,0.15)" }}>
                  <XCircle style={{ width:15, height:15, color:"var(--red)", flexShrink:0, marginTop:1 }} />
                  <div>
                    <p style={{ fontSize:13, fontWeight:700, color:"var(--red)" }}>{f.title}</p>
                    <p style={{ fontSize:12, lineHeight:1.5, color:"var(--text-secondary)", marginTop:2 }}>{f.detail}</p>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ marginTop:12, display:"flex", gap:10, padding:12, borderRadius:10, background:"rgba(26,90,154,0.07)", borderInlineStart:`3px solid #1a5a9a` }}>
              <div>
                <p style={{ fontSize:12, fontWeight:700, color:"#1a5a9a", marginBottom:3 }}>{t("report_recommendation")}</p>
                <p style={{ fontSize:12, lineHeight:1.6, color:"var(--text-secondary)" }}>{result.recommendation}</p>
              </div>
            </div>
          </div>

          {/* Questions + freeze */}
          <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
            <div style={{ padding:16, borderRadius:12, background:"var(--bg-subtle)", border:"1px solid var(--border)" }}>
              <p style={{ fontSize:11, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.08em", color:"var(--text-muted)", marginBottom:12 }}>{t("report_questions")}</p>
              <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                {result.interruptionQuestions.map((q) => {
                  const checked = !!answers[q.id];
                  return (
                    <label key={q.id} style={{ display:"flex", alignItems:"flex-start", gap:10, cursor:"pointer" }}>
                      <button onClick={() => setAnswers(p => ({ ...p, [q.id]: !p[q.id] }))} style={{ background:"none", border:"none", cursor:"pointer", padding:0, flexShrink:0, marginTop:1 }}>
                        {checked
                          ? <CheckSquare style={{ width:18, height:18, color:"var(--red)" }} />
                          : <Square      style={{ width:18, height:18, color:"var(--border)" }} />
                        }
                      </button>
                      <span style={{ fontSize:13, lineHeight:1.5, color: checked ? "var(--red)" : "var(--text-primary)", fontWeight: checked ? 700 : 400 }}>{q.text}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <button onClick={() => onFreezeRequest?.(result.caseId)} className="btn-danger" style={{ width:"100%", padding:"13px 16px", borderRadius:12, fontSize:15 }}>
              <Snowflake style={{ width:18, height:18 }} />
              {t("freeze_btn")}
            </button>
            <p style={{ fontSize:11, textAlign:"center", color:"var(--text-muted)", lineHeight:1.5 }}>{t("freeze_hint")}</p>
          </div>
        </div>
      )}
    </div>
  );
}
