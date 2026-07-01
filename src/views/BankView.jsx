import { useEffect, useState, useCallback } from "react";
import { Download, RefreshCw } from "lucide-react";
import * as XLSX from "xlsx";
import StatsCards      from "../components/bank/StatsCards";
import CasesTable      from "../components/bank/CasesTable";
import CaseDetailPanel from "../components/bank/CaseDetailPanel";
import { getActiveCases } from "../api/fraudService";
import { useApp } from "../context/useApp";

export default function BankView({ injectedCase }) {
  const { t, showModal } = useApp();
  const [stats,       setStats]       = useState(null);
  const [cases,       setCases]       = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [selectedCase,setSelectedCase]= useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try { const d = await getActiveCases(); setStats(d.stats); setCases(d.cases); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  useEffect(() => {
    if (!injectedCase) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCases(prev => [injectedCase, ...prev.filter(c => c.id !== injectedCase.id)]);
    setStats(prev => prev ? { ...prev, criticalToday: prev.criticalToday + 1, accountsFrozen: prev.accountsFrozen + 1 } : prev);
  }, [injectedCase]);

  function handleExport() {
    const data = cases.map(c => ({
      "رقم البلاغ":   c.id,
      "العميل":       c.customerName,
      "نمط الاحتيال": c.fraudPattern,
      "درجة الخطر":   c.riskScore,
      "مستوى الخطر":  c.riskLevel,
      "حالة الحساب":  c.accountStatus,
      "الوقت":        c.timeAgo,
    }));
    const ws = XLSX.utils.json_to_sheet(data);

    // Auto-fit column widths
    const cols = Object.keys(data[0] ?? {});
    ws["!cols"] = cols.map((col) => {
      const maxLen = Math.max(col.length, ...data.map((row) => String(row[col] ?? "").length));
      return { wch: Math.min(Math.max(maxLen + 4, 16), 60) };
    });

    // Row heights
    ws["!rows"] = [{ hpt: 22 }, ...data.map(() => ({ hpt: 20 }))];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "الحالات");
    XLSX.writeFile(wb, `amanguard-cases-${Date.now()}.xlsx`);
    showModal({ title: t("export_success_title"), message: t("export_success_msg"), type: "success" });
  }

  function handleCaseAction(action, caseData) {
    setCases(prev => prev.map(c => c.id === caseData.id
      ? { ...c, accountStatus: action === "frozen" ? "frozen" : action === "dismissed" ? "active" : c.accountStatus }
      : c
    ));
  }

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:18 }} className="animate-fade-in">
      {selectedCase && (
        <CaseDetailPanel
          caseData={selectedCase}
          onClose={() => setSelectedCase(null)}
          onAction={handleCaseAction}
        />
      )}

      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <div>
          <p style={{ fontSize:11, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.1em", color:"var(--gold)" }}>{t("live_monitoring")}</p>
          <h2 style={{ fontSize:20, fontWeight:900, color:"var(--text-primary)", marginTop:2 }}>{t("bank_page_title")}</h2>
        </div>
        <div style={{ display:"flex", gap:10 }}>
          <button onClick={handleExport} className="btn-ghost">
            <Download style={{ width:16, height:16 }} />
            {t("export_report")}
          </button>
          <button onClick={load} className="btn-primary" style={{ padding:"9px 18px" }}>
            <RefreshCw style={{ width:16, height:16 }} className={loading ? "animate-spin" : ""} />
            {t("refresh")}
          </button>
        </div>
      </div>

      <StatsCards stats={stats} />
      <CasesTable
        cases={cases}
        onRefresh={load}
        highlightId={injectedCase?.id}
        onExport={handleExport}
        onSelectCase={setSelectedCase}
      />
    </div>
  );
}
