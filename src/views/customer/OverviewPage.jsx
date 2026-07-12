import PageHeader  from "../../components/layout/PageHeader";
import AccountCard from "../../components/customer/AccountCard";
import { useApp } from "../../context/useApp";
import { useRelativeTime } from "../../hooks/useRelativeTime";

const QUICK_ACTIONS = [
  { id: "call-verify",      icon: "📞", titleKey: "page_call_verify",      descKey: "page_call_verify_desc" },
  { id: "scam-check",       icon: "🔍", titleKey: "page_scam_check",       descKey: "page_scam_check_desc" },
  { id: "purchase-protect", icon: "🛒", titleKey: "page_purchase_protect", descKey: "page_purchase_protect_desc" },
];

// Hook-per-row: useRelativeTime can't run inside a .map() in the parent body.
function NotificationRow({ n, lang }) {
  const timeAgo = useRelativeTime(n.createdAt);
  return (
    <div style={{ display:"flex", alignItems:"flex-start", gap:10, padding:"10px 0", borderBottom:"1px solid var(--border-subtle)" }}>
      <span style={{ fontSize:18, flexShrink:0 }}>{n.icon}</span>
      <div style={{ minWidth:0, flex:1 }}>
        <p style={{ fontSize:13, fontWeight:700, color:"var(--text-primary)" }}>
          {lang === "en" && n.titleEn ? n.titleEn : n.titleAr}
        </p>
        <p style={{ fontSize:11, color:"var(--text-muted)", marginTop:2 }}>{timeAgo}</p>
      </div>
      {!n.read && <span className="live-dot" style={{ marginTop:5 }} />}
    </div>
  );
}

export default function OverviewPage({ isMobile, onNavigate }) {
  const { t, lang, notifications } = useApp();
  const recentUnread = notifications.filter((n) => !n.read).slice(0, 3);

  return (
    <div className="animate-fade-in" style={{ display:"flex", flexDirection:"column", gap:18, overflowX:"hidden" }}>
      <PageHeader icon="🏠" titleKey="page_overview" descKey="page_overview_desc" isMobile={isMobile} />

      <AccountCard isMobile={isMobile} />

      {/* Quick actions */}
      <div>
        <p style={{ fontSize:11, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.08em", color:"var(--text-muted)", marginBottom:10 }}>
          {t("quick_actions")}
        </p>
        <div className="customer-page-grid-3" style={{ display:"grid", gridTemplateColumns:"repeat(3, 1fr)", gap:14 }}>
          {QUICK_ACTIONS.map((a) => (
            <button
              key={a.id}
              onClick={() => onNavigate?.(a.id)}
              className="card"
              style={{
                padding: isMobile ? 14 : 20, cursor:"pointer", textAlign:"start",
                display:"flex", flexDirection:"column", gap:8, minHeight:44,
                fontFamily:"inherit",
              }}
            >
              <span style={{ fontSize:26 }}>{a.icon}</span>
              <span style={{ fontSize:14, fontWeight:900, color:"var(--text-primary)" }}>{t(a.titleKey)}</span>
              <span style={{ fontSize:12, lineHeight:1.5, color:"var(--text-muted)" }}>{t(a.descKey)}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Recent unread notifications */}
      <div className="card" style={{ padding: isMobile ? 12 : 16 }}>
        <p style={{ fontSize:11, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.08em", color:"var(--text-muted)", marginBottom:6 }}>
          {t("recent_notifications")}
        </p>
        {recentUnread.length === 0 && (
          <p style={{ fontSize:13, color:"var(--text-muted)", padding:"10px 0" }}>{t("no_notifs")}</p>
        )}
        {recentUnread.map((n) => (
          <NotificationRow key={n.id} n={n} lang={lang} />
        ))}
      </div>
    </div>
  );
}
