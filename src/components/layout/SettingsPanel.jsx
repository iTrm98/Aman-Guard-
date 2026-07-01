import { X, Settings, Sun, Moon } from "lucide-react";
import { useApp } from "../../context/AppContext";

export default function SettingsPanel({ onClose }) {
  const { t, theme, toggleTheme, lang, toggleLang } = useApp();

  return (
    <>
      <div className="panel-overlay" onClick={onClose} />
      <div className="panel-drawer animate-slide-in">
        <div style={{ padding:"16px 20px", borderBottom:"1px solid var(--border)", display:"flex", alignItems:"center", justifyContent:"space-between", flexShrink:0 }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <Settings style={{ width:18, height:18, color:"var(--gold)" }} />
            <span style={{ fontWeight:900, fontSize:16, color:"var(--text-primary)" }}>{t("settings_title")}</span>
          </div>
          <button onClick={onClose} style={{ background:"var(--bg-subtle)", border:"1px solid var(--border)", borderRadius:8, padding:6, cursor:"pointer", color:"var(--text-muted)" }}>
            <X style={{ width:14, height:14 }} />
          </button>
        </div>

        <div style={{ flex:1, overflowY:"auto", padding:20 }}>
          {/* Appearance */}
          <Section label={t("appearance")}>
            <div style={{ display:"flex", gap:10 }}>
              {[
                { val:"light", Icon: Sun,  label: t("mode_light") },
                { val:"dark",  Icon: Moon, label: t("mode_dark")  },
              ].map(({ val, Icon, label }) => (
                <button
                  key={val}
                  onClick={() => theme !== val && toggleTheme()}
                  style={{
                    flex:1, padding:"12px 0", borderRadius:12, cursor:"pointer",
                    display:"flex", flexDirection:"column", alignItems:"center", gap:8,
                    border: theme === val ? "2px solid var(--gold)" : "1.5px solid var(--border)",
                    background: theme === val ? "rgba(196,154,90,0.08)" : "var(--bg-subtle)",
                    color: theme === val ? "var(--gold)" : "var(--text-secondary)",
                    fontWeight: theme === val ? 700 : 500, fontSize:13,
                    transition:"all 0.15s",
                  }}
                >
                  <Icon style={{ width:20, height:20 }} />
                  {label}
                </button>
              ))}
            </div>
          </Section>

          {/* Language */}
          <Section label={t("language")}>
            <div style={{ display:"flex", gap:10 }}>
              {[
                { val:"ar", label: t("lang_arabic"),  flag:"🇸🇦" },
                { val:"en", label: t("lang_english"), flag:"🇬🇧" },
              ].map(({ val, label, flag }) => (
                <button
                  key={val}
                  onClick={() => lang !== val && toggleLang()}
                  style={{
                    flex:1, padding:"12px 0", borderRadius:12, cursor:"pointer",
                    display:"flex", flexDirection:"column", alignItems:"center", gap:8,
                    border: lang === val ? "2px solid var(--gold)" : "1.5px solid var(--border)",
                    background: lang === val ? "rgba(196,154,90,0.08)" : "var(--bg-subtle)",
                    color: lang === val ? "var(--gold)" : "var(--text-secondary)",
                    fontWeight: lang === val ? 700 : 500, fontSize:13,
                    transition:"all 0.15s",
                  }}
                >
                  <span style={{ fontSize:24 }}>{flag}</span>
                  {label}
                </button>
              ))}
            </div>
          </Section>

          {/* About */}
          <Section label="AmanGuard">
            <div style={{ background:"var(--bg-subtle)", border:"1px solid var(--border)", borderRadius:12, padding:14 }}>
              {[
                { label: lang === "ar" ? "الإصدار" : "Version",   val: "v1.0.0-demo" },
                { label: lang === "ar" ? "البيئة"  : "Env",       val: "Mock Mode"   },
                { label: lang === "ar" ? "المحرك"  : "AI Engine", val: "v2.1"        },
              ].map(({ label, val }) => (
                <div key={label} style={{ display:"flex", justifyContent:"space-between", padding:"6px 0", borderBottom:"1px solid var(--border-subtle)", fontSize:13 }}>
                  <span style={{ color:"var(--text-muted)" }}>{label}</span>
                  <span style={{ color:"var(--text-primary)", fontWeight:700 }}>{val}</span>
                </div>
              ))}
            </div>
          </Section>
        </div>
      </div>
    </>
  );
}

function Section({ label, children }) {
  return (
    <div style={{ marginBottom:24 }}>
      <p style={{ fontSize:11, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.08em", color:"var(--text-muted)", marginBottom:12 }}>{label}</p>
      {children}
    </div>
  );
}
