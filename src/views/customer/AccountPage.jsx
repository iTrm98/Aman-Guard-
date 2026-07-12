import { useCallback, useEffect, useState } from "react";
import { RefreshCw, ShieldCheck } from "lucide-react";
import PageHeader  from "../../components/layout/PageHeader";
import AccountCard from "../../components/customer/AccountCard";
import { getAccountInfo } from "../../api/fraudService";
import { apiErrorMessage } from "../../api/client";
import { useApp } from "../../context/useApp";

const STATUS = {
  active:               { cls:"status-active",  tKey:"status_active"  },
  partially_restricted: { cls:"status-partial", tKey:"status_partial" },
  frozen:               { cls:"status-frozen",  tKey:"status_frozen"  },
};

function SkeletonLines({ count = 3 }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} style={{ height:14, borderRadius:6, background:"var(--border-subtle)", animation:"pulseSoft 1.5s ease-in-out infinite" }} />
      ))}
    </div>
  );
}

export default function AccountPage({ isMobile }) {
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

  // GET /account/me has no transactions array today — render it if the
  // backend ever adds one, otherwise show the placeholder.
  const transactions = Array.isArray(account?.transactions) ? account.transactions.slice(0, 5) : [];
  const status = STATUS[account?.status] ?? STATUS.active;

  return (
    <div className="animate-fade-in" style={{ display:"flex", flexDirection:"column", gap:18, overflowX:"hidden" }}>
      <PageHeader icon="💳" titleKey="page_account" descKey="page_account_desc" isMobile={isMobile} />

      <AccountCard isMobile={isMobile} />

      <div className="customer-page-grid-2" style={{ display:"grid", gridTemplateColumns:"repeat(2, 1fr)", gap:14 }}>
        {/* Recent activity */}
        <div className="card" style={{ padding: isMobile ? 12 : 16 }}>
          <p style={{ fontSize:11, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.08em", color:"var(--text-muted)", marginBottom:10 }}>
            {t("recent_activity")}
          </p>
          {loading && <SkeletonLines count={4} />}
          {!loading && error && (
            <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-start", gap:10 }}>
              <p style={{ fontSize:13, color:"var(--red)" }}>{error}</p>
              <button onClick={load} className="btn-ghost" style={{ padding:"6px 12px", fontSize:12, minHeight:44 }}>
                <RefreshCw style={{ width:13, height:13 }} />
                {t("retry_btn")}
              </button>
            </div>
          )}
          {!loading && !error && transactions.length === 0 && (
            <p style={{ fontSize: isMobile ? 13 : 13.5, color:"var(--text-muted)", padding: isMobile ? "6px 0" : "8px 0" }}>
              {t("no_recent_activity")}
            </p>
          )}
          {!loading && !error && transactions.map((tx, i) => (
            <div key={tx.id ?? i} style={{ display:"flex", justifyContent:"space-between", gap:10, padding: isMobile ? "8px 0" : "10px 0", borderBottom:"1px solid var(--border-subtle)", fontSize: isMobile ? 13 : 13.5 }}>
              <span style={{ color:"var(--text-primary)", fontWeight:600, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                {tx.description ?? tx.merchantName ?? tx.type ?? "—"}
              </span>
              {tx.amount != null && (
                <span style={{ color:"var(--text-secondary)", fontWeight:700, direction:"ltr", flexShrink:0 }}>
                  {tx.amount} {t("sar")}
                </span>
              )}
            </div>
          ))}
        </div>

        {/* Security status */}
        <div className="card" style={{ padding: isMobile ? 12 : 16 }}>
          <p style={{ fontSize:11, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.08em", color:"var(--text-muted)", marginBottom:10 }}>
            {t("security_status_title")}
          </p>
          {loading && <SkeletonLines count={2} />}
          {!loading && error && <p style={{ fontSize:13, color:"var(--red)" }}>{error}</p>}
          {!loading && !error && account && (
            <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:10 }}>
                <span style={{ fontSize:13, color:"var(--text-secondary)", fontWeight:600 }}>{t("case_status")}</span>
                <span className={`status-badge ${status.cls}`}>{t(status.tKey)}</span>
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:8, padding:"8px 12px", borderRadius:10, background:"rgba(151,132,226,0.1)", border:"1px solid rgba(151,132,226,0.25)" }}>
                <ShieldCheck style={{ width:15, height:15, color:"var(--gold)", flexShrink:0 }} />
                <span style={{ fontSize:12.5, fontWeight:700, color:"var(--gold)" }}>{t("account_protected")}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
