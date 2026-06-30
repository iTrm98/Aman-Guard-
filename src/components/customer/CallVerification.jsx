import { useState } from "react";
import { Phone, Search, RotateCw, Loader2, TriangleAlert } from "lucide-react";
import { checkCallStatus } from "../../api/fraudService";

export default function CallVerification() {
  const [status, setStatus] = useState("idle"); // idle | loading | done
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  async function handleCheck() {
    setStatus("loading");
    setError(null);
    try {
      const data = await checkCallStatus();
      setResult(data);
      setStatus("done");
    } catch {
      setError("تعذر التحقق من حالة الاتصال حالياً. حاول مرة أخرى.");
      setStatus("idle");
    }
  }

  return (
    <div className="glass-panel rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
      <div className="absolute top-0 right-0 w-16 h-16 bg-brand-gold opacity-10 rounded-bl-full" />
      <div className="flex items-start gap-4 mb-4">
        <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center text-xl shrink-0">
          <Phone className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-brand-dark mb-1">التحقق من مكالمة البنك</h3>
          <p className="text-sm text-gray-500">
            هل تتحدث مع شخص يدعي أنه موظف بنك الآن؟ تحقق من وجود اتصال رسمي.
          </p>
        </div>
      </div>

      <button
        onClick={handleCheck}
        disabled={status === "loading"}
        className="w-full mt-4 bg-brand-dark text-white font-bold py-3 rounded-xl hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 shadow-md disabled:opacity-60"
      >
        {status === "done" ? (
          <>
            <span>إعادة الفحص</span>
            <RotateCw className="w-4 h-4 text-brand-gold" />
          </>
        ) : (
          <>
            <span>فحص حالة الاتصال الآن</span>
            <Search className="w-4 h-4 text-brand-gold" />
          </>
        )}
      </button>

      {status === "loading" && (
        <div className="mt-4 text-center text-brand-gold text-sm py-2 flex items-center justify-center gap-2">
          <Loader2 className="w-5 h-5 animate-spin" />
          جاري التحقق من السجلات...
        </div>
      )}

      {error && <p className="mt-4 text-center text-brand-red text-sm">{error}</p>}

      {status === "done" && result && !result.hasActiveOfficialCall && (
        <div className="mt-4 bg-red-50 border border-red-200 rounded-xl p-4 animate-fade-in">
          <div className="flex gap-3">
            <TriangleAlert className="w-5 h-5 text-brand-red mt-0.5 shrink-0" />
            <div>
              <h4 className="font-bold text-brand-red">لا يوجد اتصال رسمي نشط</h4>
              <p className="text-sm text-red-700 mt-1">{result.message}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
