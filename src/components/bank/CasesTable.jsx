import { useState } from "react";
import { Search, RefreshCw, Download, ChevronDown, ChevronUp, Skull, AlertTriangle, AlertCircle } from "lucide-react";

const RISK = {
  critical: { label: "حرج",   cls: "risk-critical", Icon: Skull },
  high:     { label: "عالٍ",  cls: "risk-high",     Icon: AlertTriangle },
  medium:   { label: "متوسط", cls: "risk-medium",   Icon: AlertCircle },
};

const STATUS = {
  active:               { label: "نشط",           cls: "status-active"  },
  partially_restricted: { label: "مقيد جزئياً",  cls: "status-partial" },
  frozen:               { label: "مجمد",          cls: "status-frozen"  },
};

export default function CasesTable({ cases, onRefresh, highlightId }) {
  const [query,  setQuery]  = useState("");
  const [sortBy, setSortBy] = useState("riskScore");
  const [sortDir,setSortDir]= useState("desc");

  const filtered = cases
    .filter((c) =>
      !query ||
      c.id.toLowerCase().includes(query.toLowerCase()) ||
      c.customerName.includes(query)
    )
    .sort((a, b) => {
      const v = sortDir === "asc" ? 1 : -1;
      if (sortBy === "riskScore") return (a.riskScore - b.riskScore) * v;
      return 0;
    });

  function toggleSort(col) {
    if (sortBy === col) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortBy(col); setSortDir("desc"); }
  }

  const SortIcon = sortDir === "asc" ? ChevronUp : ChevronDown;

  return (
    <div className="card overflow-hidden">
      {/* Table header / controls */}
      <div
        className="flex items-center justify-between px-5 py-3.5"
        style={{ borderBottom: "1px solid #edf0f4", background: "#fafbfc" }}
      >
        <div className="flex items-center gap-2">
          <div className="live-dot" />
          <p className="font-black text-sm" style={{ color: "#0d1b2a" }}>سجل الحالات الحية</p>
          <span
            className="text-xs px-2 py-0.5 rounded-full font-bold"
            style={{ background: "#edf0f4", color: "#5a6a7a" }}
          >
            {filtered.length} حالة
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2" style={{ color: "#a0aab4" }} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="بحث..."
              className="input-field pr-8 text-xs"
              style={{ width: 160, paddingTop: 6, paddingBottom: 6 }}
            />
          </div>
          <button onClick={onRefresh} className="btn-ghost" style={{ padding: "6px 10px" }}>
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          <button className="btn-ghost" style={{ padding: "6px 10px" }}>
            <Download className="w-3.5 h-3.5" />
            <span className="text-xs">تصدير</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-right text-sm">
          <thead>
            <tr style={{ borderBottom: "1px solid #edf0f4" }}>
              {[
                { label: "رقم البلاغ",      col: null },
                { label: "العميل",           col: null },
                { label: "نمط الاحتيال",    col: null },
                { label: "درجة الخطر",       col: "riskScore" },
                { label: "الحساب",           col: null },
                { label: "إجراء",            col: null },
              ].map(({ label, col }) => (
                <th
                  key={label}
                  className="px-5 py-3 font-bold text-xs uppercase tracking-wide cursor-pointer select-none"
                  style={{ color: "#8090a0", background: "#fafbfc" }}
                  onClick={() => col && toggleSort(col)}
                >
                  <span className="flex items-center gap-1 justify-end">
                    {col === sortBy && <SortIcon className="w-3 h-3" />}
                    {label}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((c, i) => {
              const risk    = RISK[c.riskLevel]   ?? RISK.medium;
              const status  = STATUS[c.accountStatus] ?? STATUS.active;
              const RiskIcon = risk.Icon;
              const isNew   = c.id === highlightId;

              return (
                <tr
                  key={c.id}
                  className="transition-colors"
                  style={{
                    borderBottom: "1px solid #edf0f4",
                    background: isNew
                      ? "rgba(192,57,43,0.04)"
                      : i % 2 === 0 ? "#fff" : "#fafbfc",
                  }}
                >
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      {isNew && <span className="live-dot" />}
                      <div>
                        <p className="font-black text-xs" style={{ color: "#0d1b2a" }}>#{c.id}</p>
                        <p
                          className="text-xs"
                          style={{ color: isNew ? "#c0392b" : "#a0aab4", fontWeight: isNew ? 700 : 400 }}
                        >
                          {c.timeAgo}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <p className="font-bold text-sm" style={{ color: "#1a2533" }}>{c.customerName}</p>
                  </td>
                  <td className="px-5 py-4">
                    <p className="text-sm" style={{ color: "#5a6a7a", maxWidth: 220 }}>{c.fraudPattern}</p>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`risk-badge ${risk.cls}`}>
                      <RiskIcon style={{ width: 11, height: 11 }} />
                      {c.riskScore} — {risk.label}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`status-badge ${status.cls}`}>{status.label}</span>
                  </td>
                  <td className="px-5 py-4 text-center">
                    {isNew ? (
                      <button className="btn-primary text-xs" style={{ padding: "6px 14px" }}>
                        تأكيد التجميد والاتصال
                      </button>
                    ) : (
                      <button className="btn-ghost text-xs" style={{ padding: "6px 14px", color: "#1a5a9a", borderColor: "#a8c9ee" }}>
                        مراجعة الحالة
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="py-10 text-center text-sm" style={{ color: "#a0aab4" }}>
                  لا توجد حالات تطابق البحث
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
