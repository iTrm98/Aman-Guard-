import { useState } from "react";
import { PieChart, Search as MagnifyingGlass, XCircle, ClipboardList, Snowflake } from "lucide-react";

export default function RiskReport({ result, onFreezeRequest }) {
  const [answers, setAnswers] = useState({});

  if (!result) return null;

  function toggleAnswer(id) {
    setAnswers((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  return (
    <div className="bg-white rounded-2xl p-6 shadow-xl border border-gray-100 animate-fade-in relative overflow-hidden">
      <div className="absolute top-0 left-0 w-2 h-full bg-brand-red" />

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 border-b pb-4">
        <div>
          <h3 className="text-2xl font-bold text-brand-dark flex items-center gap-2">
            <PieChart className="w-5 h-5 text-brand-gold" /> تقرير الذكاء الاصطناعي
          </h3>
          <p className="text-gray-500 text-sm mt-1">
            تم تحليل النص المدخل ومقاطعته مع سيناريوهات الاحتيال المعروفة.
          </p>
        </div>
        <div className="bg-red-50 px-4 py-3 rounded-xl border border-red-200 flex items-center gap-4 shadow-inner">
          <div>
            <p className="text-xs text-red-600 font-bold uppercase tracking-wider mb-1">مستوى الخطورة</p>
            <p className="text-xl font-black text-brand-red">{result.riskLabel}</p>
          </div>
          <div className="w-16 h-16 rounded-full border-4 border-brand-red flex items-center justify-center relative">
            <span className="text-xl font-black text-brand-red">{result.riskScore}</span>
            <span className="absolute -bottom-2 bg-brand-red text-white text-[10px] px-2 rounded-full font-bold">
              /100
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
        <div>
          <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
            <MagnifyingGlass className="w-4 h-4 text-blue-500" /> أسباب الاشتباه المستخرجة:
          </h4>
          <ul className="space-y-3">
            {result.findings.map((finding) => (
              <li key={finding.title} className="flex items-start gap-2 text-sm text-gray-700 bg-gray-50 p-2 rounded-lg">
                <XCircle className="w-4 h-4 text-brand-red mt-0.5 shrink-0" />
                <span>
                  <strong>{finding.title}:</strong> {finding.detail}
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-4 p-3 bg-blue-50 border-r-4 border-blue-500 text-sm text-blue-800 rounded-l-lg">
            <strong>توصية النظام:</strong> {result.recommendation}
          </div>
        </div>

        <div className="bg-gray-50 p-5 rounded-xl border border-gray-200">
          <h4 className="font-bold text-brand-dark mb-1 flex items-center gap-2">
            <ClipboardList className="w-4 h-4 text-brand-gold" /> أسئلة تحقق إلزامية قبل التنفيذ:
          </h4>
          <p className="text-xs text-gray-500 mb-4">لحمايتك، يرجى الإجابة بصدق على الأسئلة التالية:</p>

          <div className="space-y-3 mb-6">
            {result.interruptionQuestions.map((q) => (
              <label key={q.id} className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={!!answers[q.id]}
                  onChange={() => toggleAnswer(q.id)}
                  className="mt-0.5 h-5 w-5 cursor-pointer rounded border-2 border-gray-300 text-brand-gold focus:ring-brand-gold"
                />
                <span className="text-sm text-gray-700 font-medium group-hover:text-brand-dark transition-colors">
                  {q.text}
                </span>
              </label>
            ))}
          </div>

          <div className="border-t pt-4">
            <p className="text-xs text-gray-500 mb-3 text-center">
              إذا كنت تشك بأنها عملية احتيال، قم بتجميد الحساب فوراً لحماية أموالك.
            </p>
            <button
              onClick={() => onFreezeRequest?.(result.caseId)}
              className="w-full bg-brand-red text-white font-bold py-3 rounded-xl hover:bg-red-800 transition-colors shadow-lg shadow-red-200 flex items-center justify-center gap-2 group"
            >
              <Snowflake className="w-4 h-4 group-hover:animate-pulse" />
              <span>تجميد طارئ للحساب</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
