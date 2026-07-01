import { X, Bell, Check } from "lucide-react";
import { useApp } from "../../context/AppContext";

export default function NotificationsPanel({ onClose }) {
  const { t, notifications, markAllRead, lang } = useApp();

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
          {notifications.length === 0 ? (
            <div style={{ padding:40, textAlign:"center", color:"var(--text-muted)", fontSize:14 }}>{t("no_notifs")}</div>
          ) : notifications.map((n) => (
            <div
              key={n.id}
              style={{
                padding:"14px 20px", borderBottom:"1px solid var(--border-subtle)",
                background: n.read ? "transparent" : "rgba(196,154,90,0.05)",
                display:"flex", gap:12, alignItems:"flex-start",
              }}
            >
              <span style={{ fontSize:22, lineHeight:1 }}>{n.icon}</span>
              <div style={{ flex:1, minWidth:0 }}>
                <p style={{ fontSize:13, fontWeight:700, color:"var(--text-primary)", marginBottom:3, lineHeight:1.4 }}>
                  {n.body[lang] ?? n.body.ar}
                </p>
                <p style={{ fontSize:11, color:"var(--text-muted)" }}>{n.time}</p>
              </div>
              {!n.read && (
                <span style={{ width:8, height:8, borderRadius:"50%", background:"var(--gold)", flexShrink:0, marginTop:4 }} />
              )}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
