import { ShieldAlert, Eye, Lock, TrendingUp } from "lucide-react";

const CARDS = [
  {
    key: "criticalToday",
    label: "حالات حرجة اليوم",
    sub: "تتطلب استجابة فورية",
    Icon: ShieldAlert,
    accent: "#c0392b",
    bg: "#fdf0ef",
    border: "#f5c6c2",
    trend: "+٣ منذ الأمس",
    trendUp: true,
  },
  {
    key: "suspectedCases",
    label: "حالات قيد المراقبة",
    sub: "اشتباه متوسط إلى عالٍ",
    Icon: Eye,
    accent: "#d35400",
    bg: "#fef5ec",
    border: "#fad7b0",
    trend: "+٧ هذا الأسبوع",
    trendUp: true,
  },
  {
    key: "accountsFrozen",
    label: "حسابات مجمدة",
    sub: "إجراء احترازي نشط",
    Icon: Lock,
    accent: "#1a5a9a",
    bg: "#eaf3fb",
    border: "#a8c9ee",
    trend: "٢ تم الإفراج عنهم",
    trendUp: false,
  },
  {
    key: "amountSaved",
    label: "مبالغ محميّة (ر.س)",
    sub: "إجمالي الشهر الحالي",
    Icon: TrendingUp,
    accent: "#1a7a4a",
    bg: "#eaf7ee",
    border: "#b2dfc0",
    trend: "↑ ٢٣٪ عن الشهر الماضي",
    trendUp: false,
  },
];

export default function StatsCards({ stats }) {
  if (!stats) return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {[0,1,2,3].map((i) => (
        <div key={i} className="card p-5 h-28 animate-pulse" style={{ background: "#f0f2f5" }} />
      ))}
    </div>
  );

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {CARDS.map(({ key, label, sub, Icon, accent, bg, border, trend }) => (
        <div
          key={key}
          className="rounded-2xl p-5"
          style={{ background: "#fff", border: `1.5px solid ${border}` }}
        >
          <div className="flex justify-between items-start mb-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: bg }}
            >
              <Icon className="w-4.5 h-4.5" style={{ color: accent, width: 18, height: 18 }} />
            </div>
            <span
              className="text-xs font-semibold px-2 py-0.5 rounded-full"
              style={{ background: bg, color: accent }}
            >
              {trend}
            </span>
          </div>
          <p className="text-2xl font-black" style={{ color: "#0d1b2a" }}>{stats[key]}</p>
          <p className="text-sm font-bold mt-0.5" style={{ color: "#3a4a5a" }}>{label}</p>
          <p className="text-xs mt-0.5" style={{ color: "#8090a0" }}>{sub}</p>
        </div>
      ))}
    </div>
  );
}
