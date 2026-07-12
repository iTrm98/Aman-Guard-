import { useEffect, useState, useCallback } from "react";
import { Download, RefreshCw, AlertTriangle, Plus } from "lucide-react";
import * as XLSX from "xlsx";
import StatsCards      from "../components/bank/StatsCards";
import CasesTable      from "../components/bank/CasesTable";
import CaseDetailPanel from "../components/bank/CaseDetailPanel";
import AddCasePanel    from "../components/bank/AddCasePanel";
import { getActiveCases, getCaseById } from "../api/fraudService";
import { apiErrorMessage } from "../api/client";
import { displayFraudPattern } from "../i18n/fraudPatterns";
import { useApp } from "../context/useApp";

// Arabic-locale timestamp with an explicit Gregorian calendar: plain "ar-SA"
// renders Hijri dates in V8, which is not what belongs in an export.
function formatExportTimestamp(isoString) {
  return new Date(isoString ?? Date.now()).toLocaleString("ar-SA-u-ca-gregory", {
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hour12: false,
    timeZone: "Asia/Riyadh",
  });
}

export default function BankView({ isMobile, searchQuery, injectedCase, caseToOpen, onCaseOpened }) {
  const { t, lang, showModal, refreshNotifications } = useApp();
  const [stats,       setStats]       = useState(null);
  const [cases,       setCases]       = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState(null);
  const [selectedCase,setSelectedCase]= useState(null);
  const [addCaseOpen, setAddCaseOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try { const d = await getActiveCases(); setStats(d.stats); setCases(d.cases); }
    catch (err) { setError(apiErrorMessage(err, t("data_load_error"))); }
    finally { setLoading(false); }
  }, [t]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  useEffect(() => {
    if (!injectedCase) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCases(prev => [injectedCase, ...prev.filter(c => c.id !== injectedCase.id)]);
    // Only bump the stats the injected case actually contributes to: blocked
    // high-risk purchases arrive with an active (not frozen) account status.
    setStats(prev => prev ? {
      ...prev,
      criticalToday: prev.criticalToday + (injectedCase.riskLevel === "critical" || injectedCase.riskLevel === "high" ? 1 : 0),
      accountsFrozen: prev.accountsFrozen + (injectedCase.accountStatus === "frozen" ? 1 : 0),
    } : prev);
  }, [injectedCase]);

  // Opened from a notification: fetch the referenced case and show its drawer.
  useEffect(() => {
    if (caseToOpen == null) return;
    let cancelled = false;
    getCaseById(caseToOpen)
      .then((c) => { if (!cancelled) setSelectedCase(c); })
      .catch((err) => console.error("Failed to open case from notification:", err))
      .finally(() => { if (!cancelled) onCaseOpened?.(); });
    return () => { cancelled = true; };
  }, [caseToOpen, onCaseOpened]);

  function handleExport() {
    const data = cases.map(c => ({
      "رقم البلاغ":     c.id,
      "العميل":         c.customerName,
      "نمط الاحتيال":   displayFraudPattern(c.fraudPattern, lang),
      "درجة الخطر":     c.riskScore,
      "مستوى الخطر":    c.riskLevel,
      "حالة الحساب":    c.accountStatus,
      "التاريخ والوقت": formatExportTimestamp(c.createdAt),
    }));

    // First row: export generation timestamp; the data table (with its own
    // header row) starts at A2.
    const ws = XLSX.utils.aoa_to_sheet([[`تاريخ التصدير: ${formatExportTimestamp()}`]]);
    XLSX.utils.sheet_add_json(ws, data, { origin: "A2" });

    // Auto-fit column widths
    const cols = Object.keys(data[0] ?? {});
    ws["!cols"] = cols.map((col) => {
      const maxLen = Math.max(col.length, ...data.map((row) => String(row[col] ?? "").length));
      return { wch: Math.min(Math.max(maxLen + 4, 16), 60) };
    });

    // Row heights: timestamp row, header row, then data rows
    ws["!rows"] = [{ hpt: 20 }, { hpt: 22 }, ...data.map(() => ({ hpt: 20 }))];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "الحالات");
    XLSX.writeFile(wb, `amanguard-cases-${Date.now()}.xlsx`);
    showModal({ title: t("export_success_title"), message: t("export_success_msg"), type: "success" });
  }

  function handleCaseAction(action, caseData) {
    if (action === "updated") {
      setCases(prev => prev.map(c => (c.caseId === caseData.caseId ? caseData : c)));
      return;
    }
    setCases(prev => prev.map(c => c.id === caseData.id
      ? { ...c, accountStatus: action === "frozen" ? "frozen" : action === "dismissed" ? "active" : c.accountStatus }
      : c
    ));
  }

  function handleCaseCreated(newCase) {
    setAddCaseOpen(false);
    load();
    refreshNotifications();
    showModal({
      title:   t("add_case_success_title"),
      message: t("add_case_success_msg", { n: newCase.id }),
      type:    "success",
    });
  }

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:18 }} className="animate-fade-in">
      {selectedCase && (
        <CaseDetailPanel
          key={selectedCase.caseId ?? selectedCase.id}
          caseData={selectedCase}
          onClose={() => setSelectedCase(null)}
          onAction={handleCaseAction}
        />
      )}

      {addCaseOpen && (
        <AddCasePanel
          onClose={() => setAddCaseOpen(false)}
          onCreated={handleCaseCreated}
        />
      )}

      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:10 }}>
        <div>
          <p style={{ fontSize:11, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.1em", color:"var(--gold)" }}>{t("live_monitoring")}</p>
          <h2 style={{ fontSize:20, fontWeight:900, color:"var(--text-primary)", marginTop:2 }}>{t("bank_page_title")}</h2>
        </div>
        <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
          <button onClick={() => setAddCaseOpen(true)} className="btn-primary" style={{ padding:"9px 18px" }}>
            <Plus style={{ width:16, height:16 }} />
            {t("add_case_btn")}
          </button>
          <button onClick={handleExport} className="btn-ghost" title={isMobile ? t("export_report") : undefined}>
            <Download style={{ width:16, height:16 }} />
            {!isMobile && t("export_report")}
          </button>
          <button onClick={load} className="btn-primary" style={{ padding:"9px 18px" }} title={isMobile ? t("refresh") : undefined}>
            <RefreshCw style={{ width:16, height:16 }} className={loading ? "animate-spin" : ""} />
            {!isMobile && t("refresh")}
          </button>
        </div>
      </div>

      {error && (
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:12, padding:"14px 18px", borderRadius:12, background:"rgba(192,57,43,0.08)", border:"1px solid rgba(192,57,43,0.25)" }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <AlertTriangle style={{ width:16, height:16, color:"var(--red)", flexShrink:0 }} />
            <span style={{ fontSize:13, color:"var(--red)" }}>{error}</span>
          </div>
          <button onClick={load} className="btn-primary" style={{ padding:"7px 14px", fontSize:12, flexShrink:0 }}>
            {t("retry_btn")}
          </button>
        </div>
      )}

      <StatsCards stats={stats} />
      <CasesTable
        isMobile={isMobile}
        cases={cases}
        externalSearch={searchQuery}
        onRefresh={load}
        highlightId={injectedCase?.id}
        onExport={handleExport}
        onSelectCase={setSelectedCase}
      />
    </div>
  );
}
