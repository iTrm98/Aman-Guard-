import { ShieldCheck, Lock, Eye, EyeOff, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useApp } from "../../context/useApp";
import { getAccountInfo } from "../../api/fraudService";
import { apiErrorMessage } from "../../api/client";

function formatNumber(value, lang, opts) {
  return new Intl.NumberFormat(lang === "ar" ? "ar-SA" : "en-US", opts).format(value);
}

export default function AccountCard() {
  const { t, lang } = useApp();
  const [showBalance, setShowBalance] = useState(false);
  const [account, setAccount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAccountInfo();
      setAccount(data);
    } catch (err) {
      setError(apiErrorMessage(err, t("data_load_error")));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  const stats = account ? [
    { labelKey:"ops_today",       value: formatNumber(account.stats.opsToday, lang),       noteKey:"ops_vs_yesterday" },
    { labelKey:"security_checks", value: formatNumber(account.stats.securityChecks, lang), noteKey:"last_30d"          },
    { labelKey:"threats_stopped", value: formatNumber(account.stats.threatsStopped, lang), noteKey:"this_month"        },
  ] : [];

  return (
    <div className="p-4 sm:p-6" style={{ position:"relative", overflow:"hidden", borderRadius:20, color:"#fff", background:"linear-gradient(135deg,#0d1b2a 0%,#162032 55%,#1e2d42 100%)", border:"1px solid #1e2f42", minHeight:180 }}>
      <div style={{ position:"absolute", top:-48, insetInlineEnd:-48, width:192, height:192, borderRadius:"50%", background:"#c49a5a", opacity:0.08 }} />
      <div style={{ position:"absolute", bottom:-32, insetInlineStart:96, width:128, height:128, borderRadius:"50%", background:"#c49a5a", opacity:0.04 }} />

      {loading && (
        <div style={{ position:"relative", display:"flex", flexDirection:"column", gap:16 }}>
          <div style={{ height:14, width:140, borderRadius:6, background:"rgba(255,255,255,0.08)", animation:"pulseSoft 1.5s ease-in-out infinite" }} />
          <div style={{ height:30, width:220, borderRadius:8, background:"rgba(255,255,255,0.08)", animation:"pulseSoft 1.5s ease-in-out infinite" }} />
          <div style={{ display:"flex", gap:24 }}>
            {[0,1,2].map(i => (
              <div key={i} style={{ height:36, width:70, borderRadius:8, background:"rgba(255,255,255,0.06)", animation:"pulseSoft 1.5s ease-in-out infinite" }} />
            ))}
          </div>
        </div>
      )}

      {!loading && error && (
        <div style={{ position:"relative", display:"flex", flexDirection:"column", alignItems:"flex-start", gap:12, padding:"20px 0" }}>
          <p style={{ fontSize:13, color:"#c8d8e8" }}>{error}</p>
          <button onClick={load} className="btn-primary" style={{ padding:"8px 16px" }}>
            <RefreshCw style={{ width:14, height:14 }} />
            {t("retry_btn")}
          </button>
        </div>
      )}

      {!loading && !error && account && (
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4" style={{ position:"relative" }}>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
            <span className="live-dot" />
            <span style={{ fontSize:12, fontWeight:600, color:"#8da0b3" }}>{t("account_main")}</span>
          </div>
          <p style={{ fontSize:12, color:"#4a6070", marginBottom:16 }}>{account.maskedIban}</p>

          <div style={{ display:"flex", alignItems:"flex-end", gap:10 }}>
            <div>
              <p style={{ fontSize:11, color:"#8da0b3", marginBottom:4 }}>{t("balance_available")}</p>
              <p style={{ fontSize:26, fontWeight:900, letterSpacing:"-0.02em" }}>
                {showBalance
                  ? `${formatNumber(account.balance, lang, { minimumFractionDigits:2, maximumFractionDigits:2 })} ${lang === "ar" ? t("sar") : account.currency}`
                  : `••••••• ${t("sar")}`}
              </p>
            </div>
            <button
              onClick={() => setShowBalance(v => !v)}
              style={{ marginBottom:4, padding:7, borderRadius:8, background:"rgba(255,255,255,0.08)", border:"none", cursor:"pointer", color:"#8da0b3" }}
              title={showBalance ? t("hide_balance") : t("show_balance")}
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
      )}

      {!loading && !error && account && (
      <div className="flex flex-wrap gap-6 sm:gap-8" style={{ position:"relative", marginTop:20, paddingTop:16, borderTop:"1px solid rgba(255,255,255,0.07)" }}>
        {stats.map(({ labelKey, value, noteKey }) => (
          <div key={labelKey}>
            <p style={{ fontSize:11, color:"#4a6070" }}>{t(labelKey)}</p>
            <p style={{ fontSize:18, fontWeight:900, color:"#c49a5a" }}>{value}</p>
            <p style={{ fontSize:11, color:"#304050" }}>{t(noteKey)}</p>
          </div>
        ))}
      </div>
      )}
    </div>
  );
}
