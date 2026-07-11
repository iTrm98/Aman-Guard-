import { X, Bell, Check } from "lucide-react";
import { useApp } from "../../context/useApp";
import { useRelativeTime } from "../../hooks/useRelativeTime";

// Explicit map — never build translation keys dynamically from API data.
const TYPE_LABEL_KEY = {
  freeze:   "notif_type_freeze",
  analysis: "notif_type_analysis",
  warning:  "notif_type_warning",
};

function NotificationRow({ n, lang, t, onClick }) {
  const timeAgo = useRelativeTime(n.createdAt);
  const typeKey = TYPE_LABEL_KEY[n.type];

  return (
    <div
      onClick={onClick}
      style={{
        padding:"14px 20px", borderBottom:"1px solid var(--border-subtle)",
        background: n.read ? "transparent" : "rgba(196,154,90,0.05)",
        display:"flex", gap:12, alignItems:"flex-start",
        cursor:"pointer",
        borderInlineStart: n.read ? "3px solid transparent" : "3px solid var(--gold)",
      }}
    >
      <span style={{ fontSize:22, lineHeight:1 }}>{n.icon}</span>
      <div style={{ flex:1, minWidth:0 }}>
        <p style={{ fontSize:13, fontWeight:700, color:"var(--text-primary)", marginBottom:3, lineHeight:1.4 }}>
          {lang === "en" ? n.bodyEn : n.bodyAr}
        </p>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <p style={{ fontSize:11, color:"var(--text-muted)" }}>{timeAgo}</p>
          {typeKey && (
            <span style={{ fontSize:10, fontWeight:700, padding:"1px 8px", borderRadius:99, background:"var(--bg-subtle)", border:"1px solid var(--border)", color:"var(--text-muted)" }}>
              {t(typeKey)}
            </span>
          )}
        </div>
      </div>
      {!n.read && (
        <span style={{ width:8, height:8, borderRadius:"50%", background:"var(--gold)", flexShrink:0, marginTop:4 }} />
      )}
    </div>
  );
}

function SkeletonRow() {
  return (
    <div style={{ padding:"14px 20px", borderBottom:"1px solid var(--border-subtle)", display:"flex", gap:12, alignItems:"flex-start" }}>
      <div style={{ width:22, height:22, borderRadius:6, background:"var(--bg-subtle)", animation:"pulseSoft 1.5s ease-in-out infinite", flexShrink:0 }} />
      <div style={{ flex:1, display:"flex", flexDirection:"column", gap:6 }}>
        <div style={{ height:13, width:"80%", borderRadius:4, background:"var(--bg-subtle)", animation:"pulseSoft 1.5s ease-in-out infinite" }} />
        <div style={{ height:11, width:"30%", borderRadius:4, background:"var(--bg-subtle)", animation:"pulseSoft 1.5s ease-in-out infinite" }} />
      </div>
    </div>
  );
}

export default function NotificationsPanel({ onClose, onOpenCase }) {
  const { t, notifications, notificationsLoading, markAllRead, markNotificationRead, lang } = useApp();

  function handleRowClick(n) {
    markNotificationRead(n.id);
    if (n.caseId != null) {
      onOpenCase?.(n.caseId);
    }
  }

  return (
    <>
      <div className="panel-overlay" onClick={onClose} />
      <div className="panel-drawer animate-slide-in">
        {/* Header */}
        <div style={{ padding:"16px 20px", borderBottom:"1px solid var(--border)", display:"flex", alignItems:"center", justifyContent:"space-between", flexShrink:0 }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <Bell style={{ width:18, height:18, color:"var(--gold)" }} />
            <span style={{ fontWeight:900, fontSize:16, color:"var(--text-primary)" }}>{t("notif_title")}</span>
          </div>
          <div style={{ display:"flex", gap:8 }}>
            <button onClick={markAllRead} className="btn-ghost" style={{ padding:"5px 10px", fontSize:12 }}>
              <Check style={{ width:13, height:13 }} />
              {t("mark_all_read")}
            </button>
            <button onClick={onClose} style={{ background:"var(--bg-subtle)", border:"1px solid var(--border)", borderRadius:8, padding:6, cursor:"pointer", color:"var(--text-muted)" }}>
              <X style={{ width:14, height:14 }} />
            </button>
          </div>
        </div>

        {/* List */}
        <div style={{ flex:1, overflowY:"auto" }}>
          {notificationsLoading ? (
            [0,1,2,3].map(i => <SkeletonRow key={i} />)
          ) : notifications.length === 0 ? (
            <div style={{ padding:40, textAlign:"center", color:"var(--text-muted)", fontSize:14 }}>{t("no_notifs")}</div>
          ) : notifications.map((n) => (
            <NotificationRow key={n.id} n={n} lang={lang} t={t} onClick={() => handleRowClick(n)} />
          ))}
        </div>
      </div>
    </>
  );
}
