import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, Download, Loader2, RefreshCw } from "lucide-react";
import * as XLSX from "xlsx";
import PageHeader from "../../components/layout/PageHeader";
import { getAuditLogs } from "../../api/fraudService";
import { apiErrorMessage } from "../../api/client";
import { useApp } from "../../context/useApp";
import { useRelativeTime } from "../../hooks/useRelativeTime";

// Bilingual labels for the semantic action tokens stored by the backend's
// AuditLogInterceptor, plus the raw "METHOD /path" strings older rows carry.
// Same data-file pattern as i18n/fraudPatterns.js.
const ACTION_LABELS = {
  LOGIN:                { ar: "تسجيل دخول",           en: "Login" },
  LOGOUT:               { ar: "تسجيل خروج",           en: "Logout" },
  VIEW_CASES:           { ar: "عرض الحالات",          en: "View Cases" },
  CREATE_CASE:          { ar: "إنشاء حالة يدوية",      en: "Manual Case Created" },
  UPDATE_CASE:          { ar: "تحديث حالة",            en: "Case Updated" },
  APPROVE_FREEZE:       { ar: "الموافقة على التجميد",  en: "Freeze Approved" },
  REJECT_FREEZE:        { ar: "رفض التجميد",           en: "Freeze Rejected" },
  REQUEST_FREEZE:       { ar: "طلب تجميد حساب",       en: "Account Freeze Request" },
  ANALYZE_TEXT:         { ar: "تحليل نص مشبوه",       en: "Text Analysis" },
  ANALYZE_TRANSACTION:  { ar: "تحليل عملية شراء",     en: "Purchase Analysis" },
  CONFIRM_TRANSACTION:  { ar: "تأكيد عملية شراء",     en: "Purchase Confirmed" },
  CANCEL_TRANSACTION:   { ar: "إلغاء عملية شراء",     en: "Purchase Cancelled" },
  LOOKUP_CUSTOMER:      { ar: "بحث عن عميل",          en: "Customer Lookup" },
  VIEW_CONFIG:          { ar: "عرض الإعدادات",        en: "View Config" },
  MANAGE_NOTIFICATIONS: { ar: "قراءة الإشعارات",      en: "Notifications Read" },
  VIEW_AUDIT_LOGS:      { ar: "عرض سجل التدقيق",      en: "View Audit Log" },
  "POST /api/auth/login":           { ar: "تسجيل دخول",      en: "Login" },
  "POST /api/auth/logout":          { ar: "تسجيل خروج",      en: "Logout" },
  "POST /api/freeze":               { ar: "طلب تجميد حساب",  en: "Account Freeze Request" },
  "POST /api/analyze":              { ar: "تحليل نص مشبوه",  en: "Text Analysis" },
  "POST /api/transactions/analyze": { ar: "تحليل عملية شراء", en: "Purchase Analysis" },
};

// Dropdown categories → contains-filter on the stored action token.
const FILTER_OPTIONS = [
  { value: "LOGIN",         labelAr: "تسجيل دخول",  labelEn: "Login" },
  { value: "FREEZE",        labelAr: "تجميد",        labelEn: "Freeze" },
  { value: "CREATE_CASE",   labelAr: "إنشاء حالة",   labelEn: "Case Created" },
  { value: "UPDATE_CASE",   labelAr: "تحديث حالة",   labelEn: "Case Updated" },
  { value: "ANALYZE",       labelAr: "تحليل",        labelEn: "Analysis" },
  { value: "NOTIFICATIONS", labelAr: "الإشعارات",   labelEn: "Notifications" },
];

function displayAction(action, lang) {
  const entry = ACTION_LABELS[action];
  if (entry) return lang === "en" ? entry.en : entry.ar;
  // Unknown raw "METHOD /path" rows stay as-is; unknown tokens get title-cased.
  if (action?.includes("/")) return action;
  return (action ?? "")
    .toLowerCase()
    .split("_")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

// Full timestamp in Saudi time (24h). Note "ar-SA-u-ca-gregory", not plain
// "ar-SA" — the bare locale renders Hijri dates (same guard as the BankView
// XLSX export).
function formatAuditTimestamp(isoString, lang) {
  return new Date(isoString).toLocaleString(lang === "en" ? "en-GB" : "ar-SA-u-ca-gregory", {
    timeZone: "Asia/Riyadh",
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
    hour12: false,
  });
}

// YYYY-MM-DD of a date as a Saudi calendar day (en-CA formats ISO-style).
function riyadhDateString(date) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Riyadh" }).format(date);
}

// "2026-07-05" → "05/07/2026" for the summary sheet's report period.
function ddmmyyyy(isoDate) {
  return isoDate ? isoDate.split("-").reverse().join("/") : "—";
}

function statusChipStyle(code) {
  if (code >= 500) return { color: "var(--red)", background: "rgba(192,57,43,0.1)",  border: "1px solid rgba(192,57,43,0.25)" };
  if (code >= 400) return { color: "#d35400",    background: "rgba(211,84,0,0.1)",   border: "1px solid rgba(211,84,0,0.25)" };
  return               { color: "var(--green)", background: "rgba(26,122,74,0.1)",  border: "1px solid rgba(26,122,74,0.25)" };
}

// Hook-per-row: useRelativeTime powers the hover tooltip on the time cell.
function AuditRow({ entry, index, t, lang, isMobile }) {
  const relativeTime = useRelativeTime(entry.createdAt);
  const roleLabel =
    entry.userRole === "CUSTOMER" ? t("demo_customer")
    : entry.userRole === "BANK_OFFICER" ? t("demo_officer")
    : entry.userRole;

  return (
    <tr style={{ borderBottom:"1px solid var(--border-subtle)", background: index % 2 === 0 ? "var(--table-even)" : "var(--table-odd)" }}>
      <td title={relativeTime} style={{ padding:"11px 18px", whiteSpace:"nowrap", color:"var(--text-secondary)" }}>
        {formatAuditTimestamp(entry.createdAt, lang)}
      </td>
      <td style={{ padding:"11px 18px" }}>
        <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
          <span style={{ fontWeight:700, color:"var(--text-primary)", direction:"ltr", unicodeBidi:"embed" }}>{entry.userId}</span>
          <span style={{ fontSize:10, fontWeight:700, padding:"1px 7px", borderRadius:6, background:"var(--bg-subtle)", border:"1px solid var(--border)", color:"var(--text-secondary)", whiteSpace:"nowrap" }}>
            {roleLabel}
          </span>
        </div>
      </td>
      <td style={{ padding:"11px 18px", color:"var(--text-primary)", fontWeight:600 }}>
        {displayAction(entry.action, lang)}
      </td>
      <td style={{ padding:"11px 18px", color:"var(--text-secondary)", whiteSpace:"nowrap" }}>
        {entry.entityType ? `${entry.entityType} #${entry.entityId}` : "—"}
      </td>
      {!isMobile && (
        <td style={{ padding:"11px 18px", color:"var(--text-muted)", direction:"ltr", unicodeBidi:"embed", whiteSpace:"nowrap" }}>
          {entry.ipAddress ?? "—"}
        </td>
      )}
      <td style={{ padding:"11px 18px" }}>
        <span style={{ display:"inline-block", fontSize:11, fontWeight:700, padding:"2px 8px", borderRadius:6, ...statusChipStyle(entry.httpStatus) }}>
          {entry.httpStatus}
        </span>
      </td>
    </tr>
  );
}

export default function AuditLogPage({ isMobile }) {
  const { t, lang, showModal } = useApp();
  const pageSize = isMobile ? 10 : 20;

  const [from, setFrom] = useState(() => riyadhDateString(new Date(Date.now() - 7 * 86400000)));
  const [to,   setTo]   = useState(() => riyadhDateString(new Date()));
  const [action,      setAction]      = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [search,      setSearch]      = useState("");
  const [page,        setPage]        = useState(0);
  const [data,      setData]      = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState(null);
  const [exporting, setExporting] = useState(false);

  // Debounce free-text search so typing doesn't fire a request per keystroke.
  useEffect(() => {
    const timer = setTimeout(() => { setSearch(searchInput); setPage(0); }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await getAuditLogs({ page, size: pageSize, from, to, action, search }));
    } catch (err) {
      setError(apiErrorMessage(err, t("data_load_error")));
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, from, to, action, search, t]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  const entries = data?.content ?? [];
  const total = data?.totalElements ?? 0;
  const totalPages = data?.totalPages ?? 0;
  const showingFrom = total === 0 ? 0 : page * pageSize + 1;
  const showingTo = page * pageSize + entries.length;
  const columnCount = isMobile ? 5 : 6;

  function updateFilter(setter) {
    return (value) => { setter(value); setPage(0); };
  }

  async function handleExportAuditLog() {
    setExporting(true);
    try {
      // Everything matching the current filters — not just the visible page.
      const all = await getAuditLogs({ page: 0, size: 5000, from, to, action, search });
      const rows = all.content ?? [];
      const isAr = lang === "ar";

      const H = isAr
        ? { id:"رقم السجل", user:"المستخدم", role:"الدور", action:"الإجراء", entity:"الكيان", entityId:"رقم الكيان", ip:"عنوان IP", status:"الحالة", time:"التاريخ والوقت" }
        : { id:"Record ID", user:"User", role:"Role", action:"Action", entity:"Entity", entityId:"Entity ID", ip:"IP Address", status:"Status", time:"Date & Time" };

      const sheetRows = rows.map((r) => ({
        [H.id]:       r.id,
        [H.user]:     r.userId,
        [H.role]:     r.userRole === "CUSTOMER" ? t("demo_customer") : r.userRole === "BANK_OFFICER" ? t("demo_officer") : r.userRole,
        [H.action]:   displayAction(r.action, lang),
        [H.entity]:   r.entityType ?? "—",
        [H.entityId]: r.entityId ?? "—",
        [H.ip]:       r.ipAddress ?? "—",
        [H.status]:   r.httpStatus,
        [H.time]:     formatAuditTimestamp(r.createdAt, lang),
      }));

      const ws = XLSX.utils.json_to_sheet(sheetRows);
      const cols = Object.values(H);
      ws["!cols"] = cols.map((col) => {
        const maxLen = Math.max(col.length, ...sheetRows.map((row) => String(row[col] ?? "").length));
        return { wch: Math.min(Math.max(maxLen + 4, 12), 60) };
      });
      ws["!rows"] = [{ hpt: 22 }, ...sheetRows.map(() => ({ hpt: 18 }))];

      // Summary sheet
      const freezeCount = rows.filter((r) => r.action?.toUpperCase().includes("FREEZE")).length;
      const analysisCount = rows.filter((r) => r.action?.toUpperCase().includes("ANALYZE")).length;
      const counts = {};
      rows.forEach((r) => {
        const label = displayAction(r.action, lang);
        counts[label] = (counts[label] ?? 0) + 1;
      });
      const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];

      const summaryRows = [
        [t("total_records"),      rows.length],
        [t("report_period"),      `${ddmmyyyy(from)} – ${ddmmyyyy(to)}`],
        [t("export_date"),        formatAuditTimestamp(new Date().toISOString(), lang)],
        [t("most_common_action"), top ? `${top[0]} (${top[1]})` : "—"],
        [t("freeze_count"),       freezeCount],
        [t("analysis_count"),     analysisCount],
      ];
      const wsSummary = XLSX.utils.aoa_to_sheet(summaryRows);
      wsSummary["!cols"] = [{ wch: 30 }, { wch: 44 }];
      wsSummary["!rows"] = summaryRows.map(() => ({ hpt: 18 }));

      const wb = XLSX.utils.book_new();
      // Sheets read right-to-left when the app language is Arabic.
      wb.Workbook = { Views: [{ RTL: isAr }] };
      XLSX.utils.book_append_sheet(wb, ws, isAr ? "سجل التدقيق" : "Audit Log");
      XLSX.utils.book_append_sheet(wb, wsSummary, isAr ? "ملخص" : "Summary");
      XLSX.writeFile(wb, `amanguard-audit-log-${riyadhDateString(new Date())}.xlsx`);

      showModal({ title: t("export_success_title"), message: t("export_success_msg"), type: "success" });
    } catch (err) {
      showModal({
        title:       t("export_audit_log"),
        message:     apiErrorMessage(err, t("data_load_error")),
        type:        "danger",
        confirmText: t("ok"),
      });
    } finally {
      setExporting(false);
    }
  }

  const filterLabelStyle = { display:"block", fontSize:12, fontWeight:700, color:"var(--text-muted)", marginBottom:6 };
  const thStyle = { padding:"10px 18px", fontWeight:700, fontSize:11, textTransform:"uppercase", letterSpacing:"0.06em", color:"var(--text-muted)", background:"var(--bg-subtle)", whiteSpace:"nowrap", textAlign:"start" };

  return (
    <div className="animate-fade-in" style={{ display:"flex", flexDirection:"column", gap:16, overflowX:"hidden" }}>
      <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:12, flexWrap:"wrap" }}>
        <PageHeader icon="📋" titleKey="audit_log" descKey="audit_log_desc" isMobile={isMobile} />
        <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
          <button onClick={load} className="btn-ghost" title={t("refresh")} style={{ minHeight:44 }}>
            <RefreshCw style={{ width:16, height:16 }} className={loading ? "animate-spin" : ""} />
            {!isMobile && t("refresh")}
          </button>
          <button onClick={handleExportAuditLog} disabled={exporting || loading} className="btn-ghost" style={{ minHeight:44 }}>
            {exporting
              ? <Loader2 style={{ width:16, height:16 }} className="animate-spin" />
              : <Download style={{ width:16, height:16 }} />
            }
            {t("export_audit_log")}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card" style={{ padding: isMobile ? 12 : 16 }}>
        <div style={{ display:"flex", flexDirection: isMobile ? "column" : "row", alignItems: isMobile ? "stretch" : "flex-end", gap:10, flexWrap:"wrap" }}>
          <div style={{ width: isMobile ? "100%" : 160 }}>
            <label style={filterLabelStyle}>{t("audit_filter_from")}</label>
            <input type="date" value={from} max={to} onChange={(e) => updateFilter(setFrom)(e.target.value)} className="input-field" style={{ paddingTop:8, paddingBottom:8 }} />
          </div>
          <div style={{ width: isMobile ? "100%" : 160 }}>
            <label style={filterLabelStyle}>{t("audit_filter_to")}</label>
            <input type="date" value={to} min={from} onChange={(e) => updateFilter(setTo)(e.target.value)} className="input-field" style={{ paddingTop:8, paddingBottom:8 }} />
          </div>
          <div style={{ width: isMobile ? "100%" : 190 }}>
            <label style={filterLabelStyle}>{t("audit_filter_action")}</label>
            <select value={action} onChange={(e) => updateFilter(setAction)(e.target.value)} className="input-field" style={{ paddingTop:8, paddingBottom:8 }}>
              <option value="">{t("audit_all_actions")}</option>
              {FILTER_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{lang === "en" ? opt.labelEn : opt.labelAr}</option>
              ))}
            </select>
          </div>
          <div style={{ flex:1, minWidth: isMobile ? "100%" : 180 }}>
            <label style={filterLabelStyle}>{t("audit_ip")} / {t("audit_user")}</label>
            <input value={searchInput} onChange={(e) => setSearchInput(e.target.value)} placeholder={t("search_ph")} className="input-field" style={{ paddingTop:8, paddingBottom:8 }} />
          </div>
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

      {/* Table */}
      <div className="card" style={{ overflow:"hidden" }}>
        <div style={{ overflowX:"auto" }}>
          <table style={{ width:"100%", minWidth: isMobile ? 0 : 760, fontSize:13, borderCollapse:"collapse" }}>
            <thead>
              <tr style={{ borderBottom:"1px solid var(--border-subtle)" }}>
                <th style={thStyle}>{t("audit_time")}</th>
                <th style={thStyle}>{t("audit_user")}</th>
                <th style={thStyle}>{t("audit_action")}</th>
                <th style={thStyle}>{t("audit_entity")}</th>
                {!isMobile && <th style={thStyle}>{t("audit_ip")}</th>}
                <th style={thStyle}>{t("audit_status")}</th>
              </tr>
            </thead>
            <tbody>
              {loading && [0, 1, 2, 3, 4].map((i) => (
                <tr key={i} style={{ borderBottom:"1px solid var(--border-subtle)" }}>
                  <td colSpan={columnCount} style={{ padding:"12px 18px" }}>
                    <div style={{ height:14, borderRadius:6, background:"var(--border-subtle)", animation:"pulseSoft 1.5s ease-in-out infinite" }} />
                  </td>
                </tr>
              ))}
              {!loading && !error && entries.map((entry, i) => (
                <AuditRow key={entry.id} entry={entry} index={i} t={t} lang={lang} isMobile={isMobile} />
              ))}
              {!loading && !error && entries.length === 0 && (
                <tr>
                  <td colSpan={columnCount} style={{ padding:40, textAlign:"center", color:"var(--text-muted)", fontSize:14 }}>
                    {t("no_audit_logs")}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:10, padding:"10px 18px", borderTop:"1px solid var(--border-subtle)", background:"var(--bg-subtle)", flexWrap:"wrap" }}>
          <span style={{ fontSize:12, color:"var(--text-muted)" }}>
            {total > 0 ? t("showing_entries", { from: showingFrom, to: showingTo, total }) : ""}
          </span>
          <div style={{ display:"flex", gap:8 }}>
            <button
              onClick={() => setPage((p) => Math.max(p - 1, 0))}
              disabled={loading || page <= 0}
              className="btn-ghost"
              style={{ padding:"6px 14px", fontSize:12, minHeight:44, opacity: page <= 0 ? 0.5 : 1 }}
            >
              {t("prev_page")}
            </button>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={loading || page >= totalPages - 1}
              className="btn-ghost"
              style={{ padding:"6px 14px", fontSize:12, minHeight:44, opacity: page >= totalPages - 1 ? 0.5 : 1 }}
            >
              {t("next_page")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
