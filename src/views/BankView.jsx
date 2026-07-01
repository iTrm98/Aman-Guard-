import { useEffect, useState, useCallback } from "react";
import { Download, RefreshCw } from "lucide-react";
import StatsCards from "../components/bank/StatsCards";
import CasesTable from "../components/bank/CasesTable";
import { getActiveCases } from "../api/fraudService";

export default function BankView({ injectedCase }) {
  const [stats,   setStats]   = useState(null);
  const [cases,   setCases]   = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getActiveCases();
      setStats(data.stats);
      setCases(data.cases);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  useEffect(() => {
    if (!injectedCase) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCases((prev) => [injectedCase, ...prev.filter((c) => c.id !== injectedCase.id)]);
    setStats((prev) =>
      prev ? { ...prev, criticalToday: prev.criticalToday + 1, accountsFrozen: prev.accountsFrozen + 1 } : prev
    );
  }, [injectedCase]);

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Page actions */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "#c49a5a" }}>
            مراقبة مباشرة
          </p>
          <h2 className="text-xl font-black mt-0.5" style={{ color: "#0d1b2a" }}>
            مركز عمليات مكافحة الاحتيال
          </h2>
        </div>
        <div className="flex gap-2">
          <button className="btn-ghost">
            <Download className="w-4 h-4" />
            <span>تصدير التقرير</span>
          </button>
          <button
            onClick={load}
            className="btn-primary"
            style={{ padding: "9px 18px" }}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            <span>تحديث</span>
          </button>
        </div>
      </div>

      <StatsCards stats={stats} />
      <CasesTable cases={cases} onRefresh={load} highlightId={injectedCase?.id} />
    </div>
  );
}
