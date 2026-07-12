import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, PhoneCall, RefreshCw, Snowflake, XCircle } from "lucide-react";
import PageHeader from "../../components/layout/PageHeader";
import { getAccountInfo } from "../../api/fraudService";
import { apiErrorMessage } from "../../api/client";
import { useApp } from "../../context/useApp";

const STOPPED_ITEMS = ["stop_transfers", "stop_online_purchases", "stop_card_transactions"];

export default function EmergencyFreezePage({ isMobile, onFreezeRequest }) {
  const { t } = useApp();
  const [account, setAccount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try { setAccount(await getAccountInfo()); }
    catch (err) { setError(apiErrorMessage(err, t("data_load_error"))); }
    finally { setLoading(false); }
  }, [t]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  const isFrozen = account?.status === "frozen";

  return (
    <div className="animate-fade-in" style={{ display:"flex", flexDirection:"column", overflowX:"hidden" }}>
      <PageHeader icon="❄️" titleKey="page_emergency_freeze" descKey="page_emergency_freeze_desc" isMobile={isMobile} />

      <div style={{ width:"100%", maxWidth: isMobile ? "100%" : 640, marginInline:"auto", display:"flex", flexDirection:"column", gap:16 }}>
        {loading && (
          <div className="card" style={{ padding: isMobile ? 16 : 20, display:"flex", flexDirection:"column", gap:12 }}>
            {[0, 1, 2].map((i) => (
              <div key={i} style={{ height:16, borderRadius:6, background:"var(--border-subtle)", animation:"pulseSoft 1.5s ease-in-out infinite" }} />
            ))}
          </div>
        )}

        {!loading && error && (
          <div className="card" style={{ padding: isMobile ? 16 : 20, display:"flex", flexDirection:"column", alignItems:"flex-start", gap:12 }}>
            <p style={{ fontSize:13, color:"var(--red)" }}>{error}</p>
            <button onClick={load} className="btn-primary" style={{ padding:"8px 16px", minHeight:44 }}>
              <RefreshCw style={{ width:14, height:14 }} />
              {t("retry_btn")}
            </button>
          </div>
        )}

        {/* Already frozen: status card replaces the freeze button entirely. */}
        {!loading && !error && isFrozen && (
          <div className="card" style={{ padding: isMobile ? 16 : 24, textAlign:"center", display:"flex", flexDirection:"column", alignItems:"center", gap:10 }}>
            <div style={{ width:56, height:56, borderRadius:"50%", background:"rgba(26,90,154,0.12)", display:"flex", alignItems:"center", justifyContent:"center" }}>
              <Snowflake style={{ width:26, height:26, color:"#1a5a9a" }} />
            </div>
            <p style={{ fontSize:16, fontWeight:900, color:"var(--text-primary)" }}>{t("account_already_frozen")}</p>
            <span className="status-badge status-frozen">{t("status_frozen")}</span>
            <p style={{ fontSize:13, lineHeight:1.6, color:"var(--text-secondary)" }}>{t("account_frozen_note")}</p>
          </div>
        )}

        {!loading && !error && !isFrozen && (
          <>
            {/* Warning card */}
            <div style={{ borderRadius:14, padding: isMobile ? 16 : 20, background:"rgba(192,57,43,0.08)", border:"1.5px solid rgba(192,57,43,0.25)", display:"flex", gap:12 }}>
              <AlertTriangle style={{ width:20, height:20, color:"var(--red)", flexShrink:0, marginTop:2 }} />
              <div>
                <p style={{ fontSize:14, fontWeight:900, color:"var(--red)", marginBottom:4 }}>{t("freeze_warning_title")}</p>
                <p style={{ fontSize:13, lineHeight:1.6, color:"var(--text-secondary)" }}>{t("freeze_warning_desc")}</p>
              </div>
            </div>

            {/* What gets stopped */}
            <div className="card" style={{ padding: isMobile ? 16 : 20 }}>
              <p style={{ fontSize:11, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.08em", color:"var(--text-muted)", marginBottom:10 }}>
                {t("what_gets_stopped")}
              </p>
              <div style={{ display:"flex", flexDirection:"column", gap: isMobile ? 8 : 12 }}>
                {STOPPED_ITEMS.map((key) => (
                  <div key={key} style={{ display:"flex", alignItems:"center", gap:10 }}>
                    <XCircle style={{ width:15, height:15, color:"var(--red)", flexShrink:0 }} />
                    <span style={{ fontSize:13, fontWeight:600, color:"var(--text-primary)" }}>{t(key)}</span>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() => onFreezeRequest?.()}
              className="btn-danger"
              style={{ width:"100%", minHeight: isMobile ? 56 : 52, borderRadius:12, fontSize:15 }}
            >
              <Snowflake style={{ width:18, height:18 }} />
              {t("freeze_btn")}
            </button>

            {/* Contact fallback */}
            <div style={{
              display:"flex", flexDirection: isMobile ? "column" : "row",
              alignItems:"center", justifyContent:"center", gap: isMobile ? 6 : 10,
              padding:"4px 0", textAlign:"center",
            }}>
              <PhoneCall style={{ width:15, height:15, color:"var(--text-muted)", flexShrink:0 }} />
              <span style={{ fontSize:13, color:"var(--text-muted)" }}>{t("contact_bank_directly")}</span>
              <span style={{ fontSize:14, fontWeight:900, color:"var(--text-primary)", direction:"ltr", unicodeBidi:"embed" }}>920 001 234</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
