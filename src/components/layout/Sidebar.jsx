import { ShieldCheck, LayoutDashboard, Bell, Settings, LogOut, ChevronLeft, ChevronRight, X } from "lucide-react";
import { useApp } from "../../context/useApp";
import { CUSTOMER_PAGES } from "../../data/customerPages";
import { BANK_PAGES } from "../../data/bankPages";

const ROLE_VIEW = { CUSTOMER: "customer", BANK_OFFICER: "bank" };

export default function Sidebar({ view, onSwitchView, isOpen, isMobile, onClose, customerPage, onCustomerPageChange, bankPage, onBankPageChange }) {
  const { t, lang, unreadCount, openPanel, showModal, currentUser, logout } = useApp();
  const displayName = lang === "en" ? currentUser.nameEn : currentUser.name;
  const rtl = lang === "ar";

  const NAV = [
    { id:"customer", labelKey:"nav_customer", Icon:ShieldCheck },
    { id:"bank",     labelKey:"nav_bank",     Icon:LayoutDashboard },
  ];

  // Each real role owns exactly one view: show only that nav item (the other is
  // removed from the DOM) and drop the demo view-switch hint. An unknown/missing
  // role falls back to the demo experience — both items plus the hint.
  const allowedView  = ROLE_VIEW[currentUser.role];
  const visibleNav   = allowedView ? NAV.filter((n) => n.id === allowedView) : NAV;
  const showDemoHint = !allowedView;

  // Desktop icon-rail: the sidebar stays in flow but collapses to icons only.
  // Mobile never uses the rail — it's either the full drawer or off-screen.
  const collapsed = !isMobile && !isOpen;

  // Per-role sub-navigation under the main nav item (null = no sub-nav).
  const subNav =
    currentUser.role === "CUSTOMER"
      ? { pages: CUSTOMER_PAGES, activeId: customerPage, onChange: onCustomerPageChange }
      : currentUser.role === "BANK_OFFICER"
        ? { pages: BANK_PAGES, activeId: bankPage, onChange: onBankPageChange }
        : null;

  const ChevronActive = lang === "ar" ? ChevronLeft : ChevronRight;

  // Geometry: fixed slide-in drawer on mobile; in-flow (collapsible) rail on desktop.
  const asideStyle = isMobile
    ? {
        position:"fixed", top:0, bottom:0, insetInlineStart:0, zIndex:40,
        width:"80vw", maxWidth:280,
        transform: isOpen ? "translateX(0)" : (rtl ? "translateX(100%)" : "translateX(-100%)"),
        transition:"transform 0.25s ease",
      }
    : {
        position:"relative",
        width: isOpen ? 230 : 60,
        transition:"width 0.25s ease",
        flexShrink:0,
      };

  // Collapsed rows center their icon and drop the text label.
  const rowStyle = collapsed ? { justifyContent:"center", padding:"10px 0" } : undefined;

  function handleLogout() {
    showModal({
      title: t("logout_title"), message: t("logout_msg"),
      type:"danger", showCancel:true, confirmText: t("logout_btn"),
      onConfirm: () => { logout(); },
    });
  }

  function handleSwitchView(id) {
    onSwitchView(id);
    if (isMobile) onClose?.();   // close the drawer after navigating on mobile
  }

  return (
    <aside
      style={{
        ...asideStyle,
        height:"100%", overflow:"hidden",
        background:"#101e2e", borderInlineStart:"1px solid #1e2f42",
        display:"flex", flexDirection:"column",
      }}
    >
      {/* Logo */}
      <div style={{ padding: collapsed ? "20px 10px 18px" : "20px 20px 18px", borderBottom:"1px solid #1e2f42" }}>
        <div style={{ display:"flex", alignItems:"center", gap:12, justifyContent: collapsed ? "center" : "flex-start" }}>

          {/* Alinma-style Box: White background, Dark Navy Icon */}
          <div style={{ width:40, height:40, borderRadius:12, background:"#ffffff", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }}>
            <ShieldCheck style={{ width:22, height:22, color:"#101e2e" }} />
          </div>

          {!collapsed && (
            <div style={{ flex:1, minWidth:0 }}>
              <p style={{ color:"#fff", fontWeight:900, fontSize:18, lineHeight:1, letterSpacing:"0.02em" }}>
                Aman<span style={{ color:"#9784e2" }}>Guard</span>
              </p>
              <p style={{ color:"#304050", fontSize:11, marginTop:3 }}>{t("brand_sub")}</p>
            </div>
          )}

          {/* Mobile drawer close button */}
          {isMobile && (
            <button
              onClick={onClose}
              aria-label={t("close_menu")}
              style={{ background:"#0a1620", border:"1px solid #1e2f42", borderRadius:8, padding:6, cursor:"pointer", color:"#8da0b3", flexShrink:0 }}
            >
              <X style={{ width:14, height:14 }} />
            </button>
          )}
        </div>
      </div>

      {/* Nav label */}
      {!collapsed && (
        <div style={{ padding:"18px 20px 8px" }}>
          <p style={{ fontSize:10, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.1em", color:"#304050" }}>
            {t("nav_label")}
          </p>
        </div>
      )}

      {/* Main nav */}
      <nav style={{ flex:1, padding: collapsed ? "12px 8px" : "0 12px" }}>
        {visibleNav.map(({ id, labelKey, Icon }) => (
          <button
            key={id}
            onClick={() => handleSwitchView(id)}
            title={collapsed ? t(labelKey) : undefined}
            className={`sidebar-item${view === id ? " active" : ""}`}
            style={rowStyle}
          >
            <Icon style={{ width:16, height:16, flexShrink:0 }} />
            {!collapsed && <span style={{ flex:1 }}>{t(labelKey)}</span>}
            {!collapsed && view === id && <ChevronActive style={{ width:12, height:12, color:"#9784e2", flexShrink:0 }} />}
          </button>
        ))}

        {/* Role sub-navigation — one entry per portal/SOC page. The navigate
            handler (App.jsx) also closes the mobile drawer. Collapsed desktop
            rail shows icon-only with a tooltip. */}
        {subNav && (
          <div style={{ marginTop:4, display:"flex", flexDirection:"column", gap:2 }}>
            {subNav.pages.map((p) => {
              const active = subNav.activeId === p.id;
              const label  = lang === "en" ? p.labelEn : p.labelAr;
              return (
                <button
                  key={p.id}
                  onClick={() => subNav.onChange?.(p.id)}
                  title={collapsed ? label : undefined}
                  className="sidebar-item"
                  style={{
                    fontSize:13, borderRadius:8,
                    padding: collapsed ? "8px 0" : "8px 12px",
                    paddingInlineStart: collapsed ? 0 : 26,
                    justifyContent: collapsed ? "center" : "flex-start",
                    minHeight: isMobile ? 44 : undefined,
                    ...(active ? { background:"var(--gold)", color:"#fff", fontWeight:700 } : {}),
                  }}
                >
                  <span style={{ fontSize:15, flexShrink:0, lineHeight:1 }}>{p.icon}</span>
                  {!collapsed && (
                    <span style={{ flex:1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{label}</span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Demo hint — only when no real role is present and the sidebar is expanded */}
        {showDemoHint && !collapsed && (
          <div style={{ margin:"14px 4px 0", borderRadius:12, padding:12, background:"#0a1620", border:"1px solid #1e2f42", fontSize:12, lineHeight:1.6, color:"#4a6070" }}>
            <span style={{ color:"#9784e2", fontWeight:700 }}>{t("demo_mode")}</span>
            <br />{t("demo_hint")}
          </div>
        )}
      </nav>

      {/* Bottom */}
      <div style={{ padding: collapsed ? "12px 8px 20px" : "12px 12px 20px", borderTop:"1px solid #1e2f42" }}>
        <button
          className="sidebar-item"
          onClick={() => openPanel("notifications")}
          title={collapsed ? t("notifications") : undefined}
          style={{ ...rowStyle, position: collapsed ? "relative" : undefined }}
        >
          <Bell style={{ width:16, height:16, flexShrink:0 }} />
          {!collapsed && <span style={{ flex:1 }}>{t("notifications")}</span>}
          {!collapsed && unreadCount > 0 && (
            <span style={{ background:"#c0392b", color:"#fff", fontSize:10, fontWeight:700, borderRadius:99, padding:"1px 6px", flexShrink:0 }}>
              {unreadCount}
            </span>
          )}
          {collapsed && unreadCount > 0 && (
            <span style={{ position:"absolute", top:6, insetInlineEnd:10, width:8, height:8, borderRadius:"50%", background:"#c0392b" }} />
          )}
        </button>
        <button className="sidebar-item" onClick={() => openPanel("settings")} title={collapsed ? t("settings") : undefined} style={rowStyle}>
          <Settings style={{ width:16, height:16, flexShrink:0 }} />
          {!collapsed && <span style={{ flex:1 }}>{t("settings")}</span>}
        </button>
        <button className="sidebar-item" onClick={handleLogout} title={collapsed ? t("logout") : undefined} style={{ ...rowStyle, color:"#c0392b" }}>
          <LogOut style={{ width:16, height:16, flexShrink:0 }} />
          {!collapsed && <span style={{ flex:1 }}>{t("logout")}</span>}
        </button>

        {/* User chip */}
        <div style={{ display:"flex", alignItems:"center", gap:10, marginTop:12, padding: collapsed ? "10px 0" : "10px 12px", borderRadius:12, background:"#0a1620", justifyContent: collapsed ? "center" : "flex-start" }}>
          <div style={{ width:32, height:32, borderRadius:"50%", background:"#9784e2", display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, fontWeight:700, color:"#fff", flexShrink:0 }}>
            {displayName.charAt(0)}
          </div>
          {!collapsed && (
            <div style={{ minWidth:0 }}>
              <p style={{ fontSize:13, fontWeight:700, color:"#c8d8e8", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{displayName}</p>
              <p style={{ fontSize:11, color:"#4a6070" }}>{t("premium_client")}</p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
