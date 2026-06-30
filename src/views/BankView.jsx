import { useEffect, useState, useCallback } from "react";
import { Download, RotateCw } from "lucide-react";
import StatsCards from "../components/bank/StatsCards";
import CasesTable from "../components/bank/CasesTable";
import { getActiveCases } from "../api/fraudService";

export default function BankView({ injectedCase }) {
  const [stats, setStats] = useState(null);
  const [cases, setCases] = useState([]);
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
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data fetch on mount
    load();
  }, [load]);

  useEffect(() => {
    if (!injectedCase) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing externally-triggered case into local table state
    setCases((prev) => [injectedCase, ...prev.filter((c) => c.id !== injectedCase.id)]);
    setStats((prev) =>
      prev
        ? {
            ...prev,
            criticalToday: prev.criticalToday + 1,
            accountsFrozen: prev.accountsFrozen + 1,
          }
        : prev
    );
  }, [injectedCase]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-brand-dark">لوحة عمليات مكافحة الاحتيال (الإنذار المبكر)</h2>
          <p className="text-gray-500 text-sm">مراقبة التنبيهات وإدارة الحالات عالية الخطورة في الوقت الفعلي.</p>
        </div>
        <div className="flex gap-3">
          <button className="bg-white border border-gray-200 text-gray-600 px-4 py-2 rounded-lg text-sm hover:bg-gray-50 transition shadow-sm flex items-center gap-2">
            <Download className="w-4 h-4" /> تصدير التقرير
          </button>
          <button
            onClick={load}
            className="bg-brand-dark text-white px-4 py-2 rounded-lg text-sm hover:bg-gray-800 transition shadow-sm flex items-center gap-2"
          >
            <RotateCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /> تحديث البيانات
          </button>
        </div>
      </div>

      <StatsCards stats={stats} />
      <CasesTable cases={cases} onRefresh={load} highlightId={injectedCase?.id} />
    </div>
  );
}
