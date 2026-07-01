import { useState } from "react";
import { AlertTriangle, XCircle, Snowflake, CheckSquare, Square, ChevronDown, ChevronUp } from "lucide-react";

/* SVG risk gauge */
function RiskGauge({ score }) {
  const r = 44;
  const circumference = Math.PI * r; // half circle
  const fraction = score / 100;
  const dashOffset = circumference * (1 - fraction);

  const color = score >= 80 ? "#c0392b" : score >= 50 ? "#d35400" : "#c49a5a";

  return (
    <svg width={112} height={70} viewBox="0 0 112 70" fill="none">
      {/* Track */}
      <path
        d={`M 12 56 A ${r} ${r} 0 0 1 100 56`}
        stroke="#edf0f4" strokeWidth={8} strokeLinecap="round" fill="none"
      />
      {/* Value */}
      <path
        d={`M 12 56 A ${r} ${r} 0 0 1 100 56`}
        stroke={color} strokeWidth={8} strokeLinecap="round" fill="none"
        strokeDasharray={circumference}
        strokeDashoffset={dashOffset}
        style={{ transition: "stroke-dashoffset 0.8s ease" }}
      />
      {/* Score text */}
      <text x={56} y={52} textAnchor="middle" fontSize={22} fontWeight={900} fill={color} fontFamily="Tajawal">
        {score}
      </text>
      <text x={56} y={64} textAnchor="middle" fontSize={9} fill="#8090a0" fontFamily="Tajawal">
        / ١٠٠
      </text>
    </svg>
  );
}

export default function RiskReport({ result, onFreezeRequest }) {
  const [answers,  setAnswers]  = useState({});
  const [expanded, setExpanded] = useState(true);

  if (!result) return null;

  const score = result.riskScore;
  const isCritical = score >= 80;

  const riskColor = isCritical ? "#c0392b" : score >= 50 ? "#d35400" : "#c49a5a";
  const riskBg    = isCritical ? "#fdf0ef" : score >= 50 ? "#fef5ec" : "#fdfbe8";
  const riskBorder= isCritical ? "#f5c6c2" : score >= 50 ? "#fad7b0" : "#f4e57a";

  return (
    <div
      className="rounded-2xl overflow-hidden animate-slide-up"
      style={{ border: "1.5px solid " + riskBorder, background: "#fff" }}
    >
      {/* Header bar */}
      <div
        className="flex items-center justify-between px-5 py-4"
        style={{ background: riskBg, borderBottom: "1px solid " + riskBorder }}
      >
        <div className="flex items-center gap-3">
          <AlertTriangle className="w-5 h-5" style={{ color: riskColor }} />
          <div>
            <p className="font-black text-base" style={{ color: riskColor }}>تقرير تحليل المخاطر</p>
            <p className="text-xs mt-0.5" style={{ color: "#8090a0" }}>
              صدر للتو • محرك الذكاء الاصطناعي v2.1
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-center">
            <RiskGauge score={score} />
            <p className="text-xs font-black -mt-1" style={{ color: riskColor }}>{result.riskLabel}</p>
          </div>
          <button
            onClick={() => setExpanded((v) => !v)}
            className="p-1.5 rounded-lg transition"
            style={{ background: "rgba(0,0,0,0.05)" }}
          >
            {expanded
              ? <ChevronUp   className="w-4 h-4" style={{ color: "#8090a0" }} />
              : <ChevronDown className="w-4 h-4" style={{ color: "#8090a0" }} />
            }
          </button>
        </div>
      </div>

      {expanded && (
        <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Findings */}
          <div>
            <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "#8090a0" }}>
              مؤشرات الاحتيال المكتشفة
            </p>
            <div className="space-y-2">
              {result.findings.map((f) => (
                <div
                  key={f.title}
                  className="flex gap-3 p-3 rounded-xl"
                  style={{ background: "#fdf0ef", border: "1px solid #f5c6c2" }}
                >
                  <XCircle className="w-4 h-4 shrink-0 mt-0.5" style={{ color: "#c0392b" }} />
                  <div>
                    <p className="text-sm font-bold" style={{ color: "#7a2020" }}>{f.title}</p>
                    <p className="text-xs mt-0.5 leading-relaxed" style={{ color: "#9a4040" }}>{f.detail}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Recommendation */}
            <div
              className="mt-3 flex gap-3 p-3 rounded-xl"
              style={{ background: "#eaf3fb", border: "1px solid #a8c9ee" }}
            >
              <div className="w-1 shrink-0 rounded-full self-stretch" style={{ background: "#1a5a9a" }} />
              <div>
                <p className="text-xs font-bold mb-0.5" style={{ color: "#1a5a9a" }}>توصية النظام</p>
                <p className="text-xs leading-relaxed" style={{ color: "#2a4a6a" }}>{result.recommendation}</p>
              </div>
            </div>
          </div>

          {/* Interruption questions + freeze */}
          <div className="flex flex-col gap-4">
            <div
              className="rounded-xl p-4"
              style={{ background: "#f8f9fb", border: "1px solid #e1e5eb" }}
            >
              <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "#8090a0" }}>
                أسئلة تحقق إلزامية
              </p>
              <div className="space-y-3">
                {result.interruptionQuestions.map((q) => {
                  const checked = !!answers[q.id];
                  return (
                    <label key={q.id} className="flex items-start gap-3 cursor-pointer group">
                      <button
                        onClick={() => setAnswers((p) => ({ ...p, [q.id]: !p[q.id] }))}
                        className="mt-0.5 shrink-0 transition"
                      >
                        {checked
                          ? <CheckSquare className="w-5 h-5" style={{ color: "#c0392b" }} />
                          : <Square      className="w-5 h-5" style={{ color: "#c0c8d2" }} />
                        }
                      </button>
                      <span
                        className="text-sm leading-relaxed transition"
                        style={{ color: checked ? "#c0392b" : "#3a4a5a", fontWeight: checked ? 700 : 400 }}
                      >
                        {q.text}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Freeze button */}
            <button
              onClick={() => onFreezeRequest?.(result.caseId)}
              className="btn-danger w-full py-3.5"
              style={{ borderRadius: 12 }}
            >
              <Snowflake className="w-5 h-5" />
              <span className="text-base">تجميد طارئ للحساب</span>
            </button>
            <p className="text-xs text-center" style={{ color: "#a0aab4" }}>
              يُوقف جميع الحوالات الصادرة فوراً ويُرسل بلاغاً لفريق الأمن المالي.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
