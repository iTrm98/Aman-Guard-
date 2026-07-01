import { ShieldCheck, Lock, Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { useApp } from "../../context/AppContext";

export default function AccountCard() {
  const { t, lang } = useApp();
  const [showBalance, setShowBalance] = useState(false);

  const stats = [
    { labelKey:"ops_today",       value: lang === "ar" ? "٣"  : "3",  noteKey:"ops_vs_yesterday" },
    { labelKey:"security_checks", value: lang === "ar" ? "١٢" : "12", noteKey:"last_30d"          },
    { labelKey:"threats_stopped", value: lang === "ar" ? "٧"  : "7",  noteKey:"this_month"        },
  ];

  return (
    <div style={{ position:"relative", overflow:"hidden", borderRadius:20, padding:24, color:"#fff", background:"linear-gradient(135deg,#0d1b2a 0%,#162032 55%,#1e2d42 100%)", border:"1px solid #1e2f42", minHeight:180 }}>
      <div style={{ position:"absolute", top:-48, insetInlineEnd:-48, width:192, height:192, borderRadius:"50%", background:"#c49a5a", opacity:0.08 }} />
      <div style={{ position:"absolute", bottom:-32, insetInlineStart:96, width:128, height:128, borderRadius:"50%", background:"#c49a5a", opacity:0.04 }} />

      <div style={{ position:"relative", display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
        <div style={{ flex:1 }}>
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
            <span className="live-dot" />
            <span style={{ fontSize:12, fontWeight:600, color:"#8da0b3" }}>{t("account_main")}</span>
          </div>
          <p style={{ fontSize:12, color:"#4a6070", marginBottom:16 }}>SA•• •••• •••• •••• 4821</p>

          <div style={{ display:"flex", alignItems:"flex-end", gap:10 }}>
            <div>
              <p style={{ fontSize:11, color:"#8da0b3", marginBottom:4 }}>{t("balance_available")}</p>
              <p style={{ fontSize:26, fontWeight:900, letterSpacing:"-0.02em" }}>
                {showBalance
                  ? (lang === "ar" ? "٤٨٬٣٢١.٥٠ ر.س" : "48,321.50 SAR")
                  : (lang === "ar" ? "••••••• ر.س" : "••••••• SAR")}
              </p>
            </div>
            <button
              onClick={() => setShowBalance(v => !v)}
              style={{ marginBottom:4, padding:7, borderRadius:8, background:"rgba(255,255,255,0.08)", border:"none", cursor:"pointer", color:"#8da0b3" }}
              title={showBalance ? (lang === "ar" ? "إخفاء الرصيد" : "Hide balance") : (lang === "ar" ? "إظهار الرصيد" : "Show balance")}
            >
              {showBalance ? <EyeOff style={{ width:16, height:16 }} /> : <Eye style={{ width:16, height:16 }} />}
            </button>
          </div>
        </div>

        <div>
          {[
            { Icon:ShieldCheck, label:t("account_protected"), color:"#c49a5a", bg:"rgba(196,154,90,0.12)", border:"rgba(196,154,90,0.25)" },
            { Icon:Lock,        label:t("account_active"),    color:"#27ae60", bg:"rgba(26,122,74,0.12)",  border:"rgba(26,122,74,0.25)"  },
          ].map(({ Icon, label, color, bg, border }) => (
            <div key={label} style={{ display:"flex", alignItems:"center", gap:8, padding:"7px 12px", borderRadius:10, background:bg, border:`1px solid ${border}`, marginBottom:8 }}>
              <Icon style={{ width:14, height:14, color }} />
              <span style={{ fontSize:12, fontWeight:700, color }}>{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Stats row */}
      <div style={{ position:"relative", marginTop:20, paddingTop:16, display:"flex", gap:32, borderTop:"1px solid rgba(255,255,255,0.07)" }}>
        {stats.map(({ labelKey, value, noteKey }) => (
          <div key={labelKey}>
            <p style={{ fontSize:11, color:"#4a6070" }}>{t(labelKey)}</p>
            <p style={{ fontSize:18, fontWeight:900, color:"#c49a5a" }}>{value}</p>
            <p style={{ fontSize:11, color:"#304050" }}>{t(noteKey)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
