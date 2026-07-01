import { ShieldCheck, LayoutDashboard, Bell, Settings, LogOut, ChevronLeft, ChevronRight, X } from "lucide-react";
import { useApp } from "../../context/AppContext";

export default function Sidebar({ view, onSwitchView, mobileOpen, onCloseMobile }) {
  const { t, lang, unreadCount, openPanel, showModal } = useApp();

  const NAV = [
    { id:"customer", labelKey:"nav_customer", Icon:ShieldCheck },
    { id:"bank",     labelKey:"nav_bank",     Icon:LayoutDashboard },
  ];

  const ChevronActive = lang === "ar" ? ChevronLeft : ChevronRight;

  function handleLogout() {
    showModal({
      title: t("logout_title"), message: t("logout_msg"),
      type:"danger", showCancel:true, confirmText: t("logout_btn"),
      onConfirm: () => {},
    });
  }

  function handleSwitchView(id) {
    onSwitchView(id);
    onCloseMobile?.();
  }

  return (
    <>
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 md:hidden" onClick={onCloseMobile} />
      )}
      <aside
        className={
          "fixed md:static inset-y-0 start-0 z-50 w-[230px] max-w-[85vw] h-full shrink-0 transition-transform duration-300 ease-in-out " +
          (mobileOpen ? "translate-x-0" : "max-md:-translate-x-full max-md:rtl:translate-x-full")
        }
        style={{ background:"#101e2e", borderInlineStart:"1px solid #1e2f42", display:"flex", flexDirection:"column" }}
      >
      {/* Logo */}
      <div style={{ padding:"20px 20px 18px", borderBottom:"1px solid #1e2f42" }}>
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          <div style={{ width:40, height:40, borderRadius:12, background:"linear-gradient(135deg,#c49a5a,#e8c27a)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
            <ShieldCheck style={{ width:20, height:20, color:"#fff" }} />
          </div>
          <div style={{ flex:1 }}>
            <p style={{ color:"#fff", fontWeight:900, fontSize:18, lineHeight:1, letterSpacing:"0.02em" }}>
              Aman<span style={{ color:"#c49a5a" }}>Guard</span>
            </p>
            <p style={{ color:"#304050", fontSize:11, marginTop:3 }}>{t("brand_sub")}</p>
          </div>
          <button
            onClick={onCloseMobile}
            className="md:hidden"
            aria-label={t("settings")}
            style={{ background:"#0a1620", border:"1px solid #1e2f42", borderRadius:8, padding:6, cursor:"pointer", color:"#8da0b3", flexShrink:0 }}
          >
            <X style={{ width:14, height:14 }} />
          </button>
        </div>
      </div>

      {/* Nav label */}
      <div style={{ padding:"18px 20px 8px" }}>
        <p style={{ fontSize:10, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.1em", color:"#304050" }}>
          {t("nav_label")}
        </p>
      </div>

      {/* Main nav */}
      <nav style={{ flex:1, padding:"0 12px" }}>
        {NAV.map(({ id, labelKey, Icon }) => (
          <button
            key={id}
            onClick={() => handleSwitchView(id)}
            className={`sidebar-item${view === id ? " active" : ""}`}
          >
            <Icon style={{ width:16, height:16, flexShrink:0 }} />
            <span style={{ flex:1 }}>{t(labelKey)}</span>
            {view === id && <ChevronActive style={{ width:12, height:12, color:"#c49a5a", flexShrink:0 }} />}
          </button>
        ))}

        {/* Demo hint */}
        <div style={{ margin:"14px 4px 0", borderRadius:12, padding:12, background:"#0a1620", border:"1px solid #1e2f42", fontSize:12, lineHeight:1.6, color:"#4a6070" }}>
          <span style={{ color:"#c49a5a", fontWeight:700 }}>{t("demo_mode")}</span>
          <br />{t("demo_hint")}
        </div>
      </nav>

      {/* Bottom */}
      <div style={{ padding:"12px 12px 20px", borderTop:"1px solid #1e2f42" }}>
        <button className="sidebar-item" onClick={() => openPanel("notifications")}>
          <Bell style={{ width:16, height:16, flexShrink:0 }} />
          <span style={{ flex:1 }}>{t("notifications")}</span>
          {unreadCount > 0 && (
            <span style={{ background:"#c0392b", color:"#fff", fontSize:10, fontWeight:700, borderRadius:99, padding:"1px 6px", flexShrink:0 }}>
              {unreadCount}
            </span>
          )}
        </button>
        <button className="sidebar-item" onClick={() => openPanel("settings")}>
          <Settings style={{ width:16, height:16, flexShrink:0 }} />
          <span style={{ flex:1 }}>{t("settings")}</span>
        </button>
        <button className="sidebar-item" onClick={handleLogout} style={{ color:"#c0392b" }}>
          <LogOut style={{ width:16, height:16, flexShrink:0 }} />
          <span style={{ flex:1 }}>{t("logout")}</span>
        </button>

        {/* User chip */}
        <div style={{ display:"flex", alignItems:"center", gap:10, marginTop:12, padding:"10px 12px", borderRadius:12, background:"#0a1620" }}>
          <div style={{ width:32, height:32, borderRadius:"50%", background:"linear-gradient(135deg,#c49a5a,#8a6030)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, fontWeight:700, color:"#fff", flexShrink:0 }}>
            ن
          </div>
          <div style={{ minWidth:0 }}>
            <p style={{ fontSize:13, fontWeight:700, color:"#c8d8e8", truncate:true, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>نواف العتيبي</p>
            <p style={{ fontSize:11, color:"#4a6070" }}>{t("premium_client")}</p>
          </div>
        </div>
      </div>
      </aside>
    </>
  );
}
