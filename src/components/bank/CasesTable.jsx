import { Search, AlertTriangle, AlertCircle, Skull, RotateCw, Download } from "lucide-react";

const RISK_STYLES = {
  critical: { wrap: "text-white bg-brand-red", Icon: Skull },
  high: { wrap: "text-red-600 bg-red-50", Icon: AlertTriangle },
  medium: { wrap: "text-orange-600 bg-orange-50", Icon: AlertCircle },
};

const STATUS_LABELS = {
  active: { label: "نشط", style: "bg-green-100 text-brand-green border-green-200" },
  partially_restricted: { label: "مقيد جزئياً", style: "bg-blue-50 text-blue-700 border-blue-200" },
  frozen: { label: "مجمد احترازياً", style: "bg-blue-100 text-blue-800 border-blue-300" },
};

export default function CasesTable({ cases, onRefresh, highlightId }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
        <h3 className="font-bold text-gray-800">أحدث البلاغات وعمليات التجميد</h3>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="بحث برقم البلاغ أو العميل..."
              className="pl-3 pr-8 py-1.5 border border-gray-200 rounded-md text-sm focus:border-brand-gold focus:ring-0"
            />
          </div>
          <button
            onClick={onRefresh}
            className="text-gray-500 hover:text-brand-dark transition p-1.5 rounded-md hover:bg-gray-100"
            title="تحديث البيانات"
          >
            <RotateCw className="w-4 h-4" />
          </button>
          <button
            className="text-gray-500 hover:text-brand-dark transition p-1.5 rounded-md hover:bg-gray-100"
            title="تصدير التقرير"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-right text-sm">
          <thead className="bg-white text-gray-500 border-b">
            <tr>
              <th className="p-4 font-medium">رقم البلاغ / الوقت</th>
              <th className="p-4 font-medium">العميل</th>
              <th className="p-4 font-medium">نمط الاحتيال المرصود</th>
              <th className="p-4 font-medium">Risk Score</th>
              <th className="p-4 font-medium">حالة الحساب</th>
              <th className="p-4 font-medium text-center">إجراءات الموظف</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {cases.map((c) => {
              const risk = RISK_STYLES[c.riskLevel] ?? RISK_STYLES.medium;
              const status = STATUS_LABELS[c.accountStatus] ?? STATUS_LABELS.active;
              const RiskIcon = risk.Icon;
              const isHighlighted = c.id === highlightId;
              return (
                <tr
                  key={c.id}
                  className={`hover:bg-gray-50 transition group ${isHighlighted ? "bg-red-50" : ""}`}
                >
                  <td className="p-4">
                    <div className="font-bold text-brand-dark">#{c.id}</div>
                    <div className={`text-xs ${isHighlighted ? "text-brand-red font-bold animate-pulse" : "text-gray-400"}`}>
                      {c.timeAgo}
                    </div>
                  </td>
                  <td className="p-4 font-medium text-gray-700">{c.customerName}</td>
                  <td className="p-4 text-gray-600">{c.fraudPattern}</td>
                  <td className="p-4">
                    <span className={`inline-flex items-center gap-1 font-bold px-2 py-1 rounded ${risk.wrap}`}>
                      <RiskIcon className="w-3 h-3" /> {c.riskScore}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-md text-xs font-bold border ${status.style}`}>
                      {status.label}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    {isHighlighted ? (
                      <button className="bg-brand-gold text-white hover:bg-yellow-700 px-4 py-2 rounded-md transition text-xs font-bold shadow-sm">
                        تأكيد التجميد والاتصال
                      </button>
                    ) : (
                      <button className="text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-md transition text-xs font-bold">
                        مراجعة الحالة
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
