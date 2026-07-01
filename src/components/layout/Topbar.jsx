import { Search, Bell, Sun, Moon, Menu } from "lucide-react";
import { useApp } from "../../context/AppContext";

export default function Topbar({ view, onOpenMobileNav }) {
  const { t, theme, toggleTheme, lang, toggleLang, unreadCount, openPanel } = useApp();

  const titles = {
    customer: { main: t("topbar_customer_title"), sub: t("topbar_customer_sub") },
    bank:     { main: t("topbar_bank_title"),     sub: t("topbar_bank_sub")     },
  };
  const { main, sub } = titles[view] ?? titles.customer;

  return (
    <header className="px-3 sm:px-4 md:px-6" style={{ height:64, background:"var(--bg-surface)", borderBottom:"1px solid var(--border)", display:"flex", alignItems:"center", justifyContent:"space-between", gap:10, flexShrink:0, transition:"background 0.25s" }}>
      <div style={{ display:"flex", alignItems:"center", gap:10, minWidth:0 }}>
        <button
          onClick={onOpenMobileNav}
          className="md:hidden"
          aria-label="menu"
          style={{ width:36, height:36, borderRadius:10, background:"var(--bg-subtle)", border:"1.5px solid var(--border)", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:"var(--text-secondary)", flexShrink:0 }}
        >
          <Menu style={{ width:16, height:16 }} />
        </button>
        <div style={{ minWidth:0 }}>
          <h1 style={{ fontWeight:900, fontSize:17, color:"var(--text-primary)", lineHeight:1.2, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{main}</h1>
          <p className="hidden sm:block" style={{ fontSize:11, color:"var(--text-muted)", marginTop:2 }}>{sub}</p>
        </div>
      </div>

      <div style={{ display:"flex", alignItems:"center", gap:10 }}>
        {/* Search */}
        <div className="hidden lg:block" style={{ position:"relative" }}>
          <Search style={{ width:14, height:14, position:"absolute", insetInlineEnd:12, top:"50%", transform:"translateY(-50%)", color:"var(--text-muted)", pointerEvents:"none" }} />
          <input
            placeholder={t("quick_search")}
            className="input-field"
            style={{ width:200, paddingTop:7, paddingBottom:7, paddingInlineEnd:36 }}
          />
        </div>

        {/* Language toggle */}
        <button
          onClick={toggleLang}
          title={lang === "ar" ? "Switch to English" : "التبديل للعربية"}
          style={{ width:36, height:36, borderRadius:10, background:"var(--bg-subtle)", border:"1.5px solid var(--border)", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:"var(--text-secondary)", fontWeight:700, fontSize:11, transition:"all 0.15s" }}
        >
          {lang === "ar" ? "EN" : "عر"}
        </button>

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          title={theme === "light" ? t("theme_dark") : t("theme_light")}
          style={{ width:36, height:36, borderRadius:10, background:"var(--bg-subtle)", border:"1.5px solid var(--border)", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:"var(--text-secondary)", transition:"all 0.15s" }}
        >
          {theme === "light"
            ? <Moon style={{ width:16, height:16 }} />
            : <Sun  style={{ width:16, height:16, color:"#c49a5a" }} />
          }
        </button>

        {/* Notifications */}
        <button
          onClick={() => openPanel("notifications")}
          style={{ width:36, height:36, borderRadius:10, background:"var(--bg-subtle)", border:"1.5px solid var(--border)", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", position:"relative", transition:"all 0.15s" }}
        >
          <Bell style={{ width:16, height:16, color:"var(--text-secondary)" }} />
          {unreadCount > 0 && (
            <span style={{ position:"absolute", top:6, insetInlineEnd:6, width:8, height:8, borderRadius:"50%", background:"#c0392b", border:"1.5px solid var(--bg-surface)" }} />
          )}
        </button>

        {/* System status */}
        <div className="hidden lg:flex" style={{ alignItems:"center", gap:7, padding:"5px 12px", borderRadius:10, background:"rgba(26,122,74,0.1)", border:"1px solid rgba(26,122,74,0.25)", fontSize:12, fontWeight:700, color:"var(--green)" }}>
          <span className="live-dot" />
          {t("system_active")}
        </div>
      </div>
    </header>
  );
}
