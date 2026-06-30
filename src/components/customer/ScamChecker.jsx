import { useState } from "react";
import { ShieldCheck, Cpu, Bot } from "lucide-react";
import { analyzeText } from "../../api/fraudService";

export default function ScamChecker({ onResult, onValidationError }) {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [hasResult, setHasResult] = useState(false);

  async function handleAnalyze() {
    if (!text.trim()) {
      onValidationError?.();
      return;
    }
    setLoading(true);
    try {
      const result = await analyzeText(text);
      onResult?.(result);
      setHasResult(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="glass-panel rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
      <div className="absolute top-0 right-0 w-16 h-16 bg-brand-dark opacity-5 rounded-bl-full" />
      <div className="flex items-start gap-4 mb-4">
        <div className="w-12 h-12 rounded-full bg-brand-gold/20 text-brand-gold flex items-center justify-center text-xl shrink-0">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-brand-dark mb-1">افحص قبل التنفيذ</h3>
          <p className="text-sm text-gray-500">
            الصق رسالة مشبوهة، رابط دفع، أو تفاصيل تحويل ليقوم الذكاء الاصطناعي بتقييم الخطورة.
          </p>
        </div>
      </div>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={3}
        placeholder="مثال: عزيزي العميل، يوجد تحديث أمني لحسابك. أرسل رمز التحقق OTP حتى لا يتم إيقاف الحساب..."
        className="w-full border-2 border-gray-200 rounded-xl p-3 text-sm focus:border-brand-gold focus:ring-0 transition-colors resize-none bg-gray-50 mb-4"
      />

      <button
        onClick={handleAnalyze}
        disabled={loading}
        className="w-full bg-brand-gold text-white font-bold py-3 rounded-xl hover:bg-yellow-700 transition-colors flex items-center justify-center gap-2 shadow-md disabled:opacity-60"
      >
        <span>{hasResult ? "فحص رسالة أخرى" : "تحليل بواسطة الذكاء الاصطناعي"}</span>
        <Cpu className="w-4 h-4" />
      </button>

      {loading && (
        <div className="mt-4 text-center text-brand-gold text-sm py-2 flex items-center justify-center gap-2">
          <Bot className="w-5 h-5 animate-bounce" />
          جاري تحليل المعطيات وحساب مستوى الخطورة...
        </div>
      )}
    </div>
  );
}
