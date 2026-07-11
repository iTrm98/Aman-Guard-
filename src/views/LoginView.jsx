import { useState } from "react";
import { ShieldCheck, Sun, Moon, ChevronDown, User, Building2, Eye, EyeOff } from "lucide-react";
import { useApp } from "../context/useApp";
import { login } from "../api/fraudService";
import { apiErrorMessage } from "../api/client";

// Full-screen login. Exchanges national id + password for a JWT session via
// the backend feature/auth endpoints, then hands the response to
// AppContext.completeLogin, which stores the token and swaps in the app shell.
export default function LoginView({ isMobile }) {
  const { t, lang, theme, toggleTheme, toggleLang, completeLogin } = useApp();

  const [nationalId, setNationalId] = useState("");
  const [password,   setPassword]   = useState("");
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState(null);
  const [showDemo,   setShowDemo]   = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!nationalId.trim() || !password || loading) return;
    setLoading(true);
    setError(null);
    try {
      const res = await login(nationalId.trim(), password);
      completeLogin(res);
    } catch (err) {
      setError(apiErrorMessage(err, t("login_error")));
      setLoading(false);
    }
  }

  const DEMO = [
    { roleKey: "demo_customer", Icon: User,      id: "1234567890", pass: "Password123!" },
    { roleKey: "demo_officer",  Icon: Building2, id: "0987654321", pass: "Password123!" },
  ];

  return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", padding: isMobile ? "20px 16px" : 20, background:"var(--bg-app)", transition:"background 0.25s" }}>

      {/* Theme / language toggles */}
      <div style={{ position:"fixed", top:16, insetInlineEnd:16, display:"flex", gap:8 }}>
        <button onClick={toggleLang} className="btn-ghost" style={{ padding:"7px 12px", fontWeight:700, fontSize:12 }}>
          {lang === "ar" ? "EN" : "عر"}
        </button>
        <button onClick={toggleTheme} className="btn-ghost" style={{ padding:7 }} title={theme === "light" ? t("theme_dark") : t("theme_light")}>
          {theme === "light" ? <Moon style={{ width:15, height:15 }} /> : <Sun style={{ width:15, height:15 }} />}
        </button>
      </div>

      <div className="card animate-fade-in" style={{ width:"100%", maxWidth:420, padding: isMobile ? "28px 20px" : "36px 32px" }}>

        {/* Brand */}
        <div style={{ display:"flex", flexDirection:"column", alignItems:"center", marginBottom:24 }}>
          <div style={{ width: isMobile ? 46 : 52, height: isMobile ? 46 : 52, borderRadius:14, background:"#101e2e", display:"flex", alignItems:"center", justifyContent:"center", marginBottom:12 }}>
            <ShieldCheck style={{ width: isMobile ? 24 : 28, height: isMobile ? 24 : 28, color:"#fff" }} />
          </div>
          <p style={{ fontWeight:900, fontSize: isMobile ? 20 : 22, color:"var(--text-primary)", letterSpacing:"0.02em" }}>
            Aman<span style={{ color:"var(--gold)" }}>Guard</span>
          </p>
          <p style={{ fontSize:12, color:"var(--text-muted)", marginTop:4 }}>{t("brand_sub")}</p>
        </div>

        <h1 style={{ fontSize:17, fontWeight:900, color:"var(--text-primary)", marginBottom:4 }}>{t("login_title")}</h1>
        <p style={{ fontSize:13, color:"var(--text-secondary)", marginBottom:18 }}>{t("login_subtitle")}</p>

        {error && (
          <div role="alert" style={{ marginBottom:14, padding:"10px 12px", borderRadius:10, fontSize:12.5, background:"rgba(192,57,43,0.08)", border:"1px solid rgba(192,57,43,0.3)", color:"var(--red)" }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <label style={{ display:"block", fontSize:12, fontWeight:700, color:"var(--text-muted)", marginBottom:6 }}>
            {t("national_id")}
          </label>
          <input
            className="input-field"
            style={{ direction:"ltr", textAlign:"start" }}
            value={nationalId}
            onChange={(e) => setNationalId(e.target.value)}
            autoFocus
            inputMode="numeric"
            autoComplete="username"
          />

          <label style={{ display:"block", fontSize:12, fontWeight:700, color:"var(--text-muted)", margin:"14px 0 6px" }}>
            {t("password")}
          </label>
          <div style={{ position:"relative" }}>
            <input
              className="input-field"
              type={showPassword ? "text" : "password"}
              style={{ direction:"ltr", textAlign:"start", ...(lang === "ar" ? { paddingRight:40 } : { paddingLeft:40 }) }}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? t("hide_password") : t("show_password")}
              title={showPassword ? t("hide_password") : t("show_password")}
              onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text-primary)")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
              style={{ position:"absolute", insetInlineStart:10, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", padding:2, display:"flex", color:"var(--text-muted)" }}
            >
              {showPassword ? <EyeOff style={{ width:16, height:16 }} /> : <Eye style={{ width:16, height:16 }} />}
            </button>
          </div>

          <button type="submit" className="btn-primary" disabled={loading || !nationalId.trim() || !password}
            style={{ width:"100%", justifyContent:"center", marginTop:18, padding:"11px 0", opacity: loading || !nationalId.trim() || !password ? 0.6 : 1 }}>
            {loading ? t("logging_in") : t("login_btn")}
          </button>
        </form>

        {/* Demo credentials (collapsible) */}
        <div style={{ marginTop:20, borderTop:"1px solid var(--border-subtle)", paddingTop:14 }}>
          <button
            onClick={() => setShowDemo((v) => !v)}
            aria-expanded={showDemo}
            style={{ display:"flex", alignItems:"center", justifyContent:"space-between", width:"100%", background:"none", border:"none", cursor:"pointer", padding:0, fontSize:12, fontWeight:700, color:"var(--text-secondary)" }}
          >
            {t("demo_credentials")}
            <ChevronDown style={{ width:14, height:14, transition:"transform 0.2s", transform: showDemo ? "rotate(180deg)" : "none" }} />
          </button>

          {showDemo && (
            <div style={{ marginTop:12, display:"flex", flexDirection:"column", gap:8 }}>
              {DEMO.map(({ roleKey, Icon, id, pass }) => (
                <div key={id} style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 12px", borderRadius:10, background:"var(--bg-subtle)", border:"1px solid var(--border)" }}>
                  <Icon style={{ width:16, height:16, color:"var(--gold)", flexShrink:0 }} />
                  <div style={{ minWidth:0 }}>
                    <p style={{ fontSize:11, fontWeight:700, color:"var(--text-muted)", marginBottom:2 }}>{t(roleKey)}</p>
                    <p style={{ direction:"ltr", textAlign:"start", fontSize:12.5, fontWeight:700, color:"var(--text-primary)", fontFamily:"monospace" }}>
                      {id} · {pass}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
