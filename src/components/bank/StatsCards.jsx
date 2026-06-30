import { AlertOctagon, Eye, Snowflake, BadgeDollarSign } from "lucide-react";

export default function StatsCards({ stats }) {
  if (!stats) return null;

  const cards = [
    {
      label: "إجمالي الحالات الحرجة اليوم",
      value: stats.criticalToday,
      icon: AlertOctagon,
      tone: "text-brand-red bg-red-50",
    },
    {
      label: "حالات الاشتباه",
      value: stats.suspectedCases,
      icon: Eye,
      tone: "text-orange-600 bg-orange-50",
    },
    {
      label: "حسابات مجمدة احترازياً",
      value: stats.accountsFrozen,
      icon: Snowflake,
      tone: "text-blue-600 bg-blue-50",
    },
    {
      label: "المبالغ التي تم إنقاذها (ر.س)",
      value: stats.amountSaved,
      icon: BadgeDollarSign,
      tone: "text-brand-green bg-green-50",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map(({ label, value, icon: Icon, tone }) => (
        <div key={label} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${tone}`}>
            <Icon className="w-5 h-5" />
          </div>
          <p className="text-2xl font-black text-brand-dark">{value}</p>
          <p className="text-xs text-gray-500 mt-1">{label}</p>
        </div>
      ))}
    </div>
  );
}
