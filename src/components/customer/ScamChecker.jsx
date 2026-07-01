import { useState } from "react";
import { ScanText, Sparkles, Loader2 } from "lucide-react";
import { analyzeText } from "../../api/fraudService";

export default function ScamChecker({ onResult, onValidationError }) {
  const [text,      setText]      = useState("");
  const [loading,   setLoading]   = useState(false);
  const [hasResult, setHasResult] = useState(false);
  const charCount = text.length;

  async function handleAnalyze() {
    if (!text.trim()) { onValidationError?.(); return; }
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
    <div className="card p-5 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: "rgba(196,154,90,0.12)", border: "1px solid rgba(196,154,90,0.2)" }}
        >
          <ScanText className="w-5 h-5" style={{ color: "#c49a5a" }} />
        </div>
        <div>
          <h3 className="font-black text-base" style={{ color: "#0d1b2a" }}>فحص قبل التنفيذ</h3>
          <p className="text-xs mt-0.5 leading-relaxed" style={{ color: "#8090a0" }}>
            الصق رسالة، رابط، أو تفاصيل تحويل مشبوه للتحليل الفوري.
          </p>
        </div>
      </div>

      <div style={{ height: 1, background: "#edf0f4" }} />

      {/* Input */}
      <div className="relative">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={4}
          placeholder="مثال: عزيزي العميل، تم رصد نشاط مريب. أرسل رمز OTP لإيقاف الإجراء..."
          className="input-field"
          style={{ resize: "none", paddingBottom: 28 }}
        />
        <div
          className="absolute bottom-2 left-3 text-xs"
          style={{ color: charCount > 400 ? "#c0392b" : "#a0aab4" }}
        >
          {charCount} / 500
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm"
          style={{ background: "rgba(196,154,90,0.07)", border: "1px solid rgba(196,154,90,0.15)" }}
        >
          <Loader2 className="w-4 h-4 animate-spin shrink-0" style={{ color: "#c49a5a" }} />
          <span style={{ color: "#8a6030" }}>يعالج النموذج المدخلات ويحسب مؤشر الخطر...</span>
        </div>
      )}

      <button
        onClick={handleAnalyze}
        disabled={loading || !text.trim()}
        className="btn-primary w-full"
      >
        <Sparkles className="w-4 h-4" />
        {hasResult ? "تحليل نص آخر" : "تحليل بواسطة الذكاء الاصطناعي"}
      </button>
    </div>
  );
}
