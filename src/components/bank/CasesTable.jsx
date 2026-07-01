import { useState } from "react";
import { Search, RefreshCw, Download, ChevronDown, ChevronUp, Skull, AlertTriangle, AlertCircle } from "lucide-react";
import { useApp } from "../../context/AppContext";

export default function CasesTable({ cases, onRefresh, highlightId, onExport, onSelectCase }) {
  const { t } = useApp();
  const [query,  setQuery]   = useState("");
  const [sortBy, setSortBy]  = useState("riskScore");
  const [sortDir,setSortDir] = useState("desc");

  const RISK = {
    critical: { cls:"risk-critical", Icon:Skull         },
    high:     { cls:"risk-high",     Icon:AlertTriangle  },
    medium:   { cls:"risk-medium",   Icon:AlertCircle    },
  };
  const STATUS = {
    active:               { cls:"status-active"  },
    partially_restricted: { cls:"status-partial" },
    frozen:               { cls:"status-frozen"  },
  };

  const filtered = cases
    .filter(c => !query || c.id.toLowerCase().includes(query.toLowerCase()) || c.customerName.includes(query))
    .sort((a, b) => {
      const v = sortDir === "asc" ? 1 : -1;
      return sortBy === "riskScore" ? (a.riskScore - b.riskScore) * v : 0;
    });

  const SortIcon = sortDir === "asc" ? ChevronUp : ChevronDown;

  const COLS = [
    { label: t("col_report"), col: null        },
    { label: t("col_client"), col: null        },
    { label: t("col_pattern"),col: null        },
    { label: t("col_risk"),   col: "riskScore" },
    { label: t("col_account"),col: null        },
    { label: t("col_action"), col: null        },
  ];

  return (
    <div className="card" style={{ overflow:"hidden" }}>
      {/* Controls */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"12px 18px", borderBottom:"1px solid var(--border-subtle)", background:"var(--bg-subtle)" }}>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <span className="live-dot" />
          <p style={{ fontWeight:900, fontSize:14, color:"var(--text-primary)" }}>{t("cases_title")}</p>
          <span style={{ fontSize:11, padding:"2px 8px", borderRadius:99, background:"var(--border-subtle)", color:"var(--text-muted)", fontWeight:700 }}>
            {filtered.length} {t("cases_count")}
          </span>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <div style={{ position:"relative" }}>
            <Search style={{ width:13, height:13, position:"absolute", insetInlineEnd:10, top:"50%", transform:"translateY(-50%)", color:"var(--text-muted)", pointerEvents:"none" }} />
            <input value={query} onChange={e => setQuery(e.target.value)} placeholder={t("search_ph")} className="input-field"
              style={{ width:190, paddingTop:6, paddingBottom:6, paddingInlineEnd:32, fontSize:13 }} />
          </div>
          <button onClick={onRefresh} className="btn-ghost" style={{ padding:"6px 10px" }} title="Refresh">
            <RefreshCw style={{ width:14, height:14 }} />
          </button>
          <button onClick={onExport} className="btn-ghost" style={{ padding:"6px 12px" }}>
            <Download style={{ width:14, height:14 }} />
            <span style={{ fontSize:12 }}>{t("export")}</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <div style={{ overflowX:"auto" }}>
        <table style={{ width:"100%", textAlign:"right", fontSize:13, borderCollapse:"collapse" }}>
          <thead>
            <tr style={{ borderBottom:"1px solid var(--border-subtle)" }}>
              {COLS.map(({ label, col }) => (
                <th key={label}
                  onClick={() => col && (sortBy === col ? setSortDir(d => d === "asc" ? "desc" : "asc") : (setSortBy(col), setSortDir("desc")))}
                  style={{ padding:"10px 18px", fontWeight:700, fontSize:11, textTransform:"uppercase", letterSpacing:"0.06em", color:"var(--text-muted)", background:"var(--bg-subtle)", cursor: col ? "pointer" : "default", userSelect:"none", whiteSpace:"nowrap" }}>
                  <span style={{ display:"flex", alignItems:"center", gap:4, justifyContent:"flex-end" }}>
                    {col === sortBy && <SortIcon style={{ width:11, height:11 }} />}
                    {label}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((c, i) => {
              const risk   = RISK[c.riskLevel]      ?? RISK.medium;
              const status = STATUS[c.accountStatus] ?? STATUS.active;
              const RiskIcon = risk.Icon;
              const isNew  = c.id === highlightId;
              return (
                <tr key={c.id} style={{ borderBottom:"1px solid var(--border-subtle)", background: isNew ? "rgba(192,57,43,0.04)" : i % 2 === 0 ? "var(--table-even)" : "var(--table-odd)", transition:"background 0.15s" }}>
                  <td style={{ padding:"13px 18px" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                      {isNew && <span className="live-dot" />}
                      <div>
                        <p style={{ fontWeight:900, fontSize:12, color:"var(--text-primary)" }}>#{c.id}</p>
                        <p style={{ fontSize:11, color: isNew ? "var(--red)" : "var(--text-muted)", fontWeight: isNew ? 700 : 400 }}>{c.timeAgo}</p>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding:"13px 18px" }}>
                    <p style={{ fontWeight:700, color:"var(--text-primary)" }}>{c.customerName}</p>
                  </td>
                  <td style={{ padding:"13px 18px" }}>
                    <p style={{ color:"var(--text-secondary)", maxWidth:200 }}>{c.fraudPattern}</p>
                  </td>
                  <td style={{ padding:"13px 18px" }}>
                    <span className={`risk-badge ${risk.cls}`}>
                      <RiskIcon style={{ width:11, height:11 }} />
                      {c.riskScore} — {t(`risk_${c.riskLevel}`)}
                    </span>
                  </td>
                  <td style={{ padding:"13px 18px" }}>
                    <span className={`status-badge ${status.cls}`}>{t(`status_${c.accountStatus}`) || c.accountStatus}</span>
                  </td>
                  <td style={{ padding:"13px 18px", textAlign:"center" }}>
                    {isNew ? (
                      <button onClick={() => onSelectCase?.(c)} className="btn-primary" style={{ padding:"6px 14px", fontSize:12 }}>
                        {t("action_confirm")}
                      </button>
                    ) : (
                      <button onClick={() => onSelectCase?.(c)} className="btn-ghost" style={{ padding:"6px 14px", fontSize:12, color:"#1a5a9a", borderColor:"rgba(26,90,154,0.3)" }}>
                        {t("action_review")}
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr><td colSpan={6} style={{ padding:40, textAlign:"center", color:"var(--text-muted)", fontSize:14 }}>{t("no_cases")}</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
