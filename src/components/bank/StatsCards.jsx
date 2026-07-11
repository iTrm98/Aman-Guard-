import { ShieldAlert, Eye, Lock, TrendingUp } from "lucide-react";
import { useApp } from "../../context/useApp";

export default function StatsCards({ stats }) {
  const { t } = useApp();

  const signed = (delta) => (delta > 0 ? `+${delta}` : `${delta ?? 0}`);

  // Trend chips are computed from real today-vs-yesterday deltas returned
  // by the backend, not hardcoded strings.
  const trendFor = {
    criticalToday:  () => t("trend_since_yesterday", { n: signed(stats?.criticalDelta) }),
    suspectedCases: () => t("trend_since_yesterday", { n: signed(stats?.suspectedDelta) }),
    accountsFrozen: () => t("trend_since_yesterday", { n: signed(stats?.frozenDelta) }),
    amountSaved:    () => t("trend_saved_today", { n: stats?.amountSavedToday ?? "0" }),
  };

  const CARDS = [
    { key:"criticalToday",  labelKey:"stats_critical",  subKey:"stats_critical_sub",  Icon:ShieldAlert, accent:"var(--red)",   bg:"rgba(192,57,43,0.08)",  border:"rgba(192,57,43,0.2)"  },
    { key:"suspectedCases", labelKey:"stats_suspected", subKey:"stats_suspected_sub", Icon:Eye,         accent:"#d35400",      bg:"rgba(211,84,0,0.08)",   border:"rgba(211,84,0,0.2)"   },
    { key:"accountsFrozen", labelKey:"stats_frozen",    subKey:"stats_frozen_sub",    Icon:Lock,        accent:"#1a5a9a",      bg:"rgba(26,90,154,0.08)",  border:"rgba(26,90,154,0.2)"  },
    { key:"amountSaved",    labelKey:"stats_saved",     subKey:"stats_saved_sub",     Icon:TrendingUp,  accent:"var(--green)", bg:"rgba(26,122,74,0.08)",  border:"rgba(26,122,74,0.2)"  },
  ];

  if (!stats) return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-3.5">
      {[0,1,2,3].map(i => <div key={i} className="card" style={{ height:110, background:"var(--bg-subtle)", animation:"pulseSoft 1.5s ease-in-out infinite" }} />)}
    </div>
  );

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-3.5">
      {CARDS.map(({ key, labelKey, subKey, Icon, accent, bg, border }) => (
        <div key={key} style={{ borderRadius:14, padding:18, background:"var(--bg-surface)", border:`1.5px solid ${border}`, transition:"box-shadow 0.2s" }} className="card">
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:12 }}>
            <div style={{ width:36, height:36, borderRadius:10, background:bg, display:"flex", alignItems:"center", justifyContent:"center" }}>
              <Icon style={{ width:17, height:17, color:accent }} />
            </div>
            <span style={{ fontSize:11, fontWeight:700, padding:"2px 8px", borderRadius:99, background:bg, color:accent }}>{trendFor[key]()}</span>
          </div>
          <p style={{ fontSize:26, fontWeight:900, color:"var(--text-primary)", lineHeight:1 }}>{stats[key]}</p>
          <p style={{ fontSize:13, fontWeight:700, color:"var(--text-secondary)", marginTop:4 }}>{t(labelKey)}</p>
          <p style={{ fontSize:11, color:"var(--text-muted)", marginTop:2 }}>{t(subKey)}</p>
        </div>
      ))}
    </div>
  );
}
