import { useState } from "react";
import { PhoneCall, RefreshCw, ShieldX, ShieldCheck, Loader2 } from "lucide-react";
import { checkCallStatus } from "../../api/fraudService";

export default function CallVerification() {
  const [status, setStatus] = useState("idle");
  const [result, setResult] = useState(null);
  const [error,  setError]  = useState(null);

  async function handleCheck() {
    setStatus("loading");
    setError(null);
    try {
      const data = await checkCallStatus();
      setResult(data);
      setStatus("done");
    } catch {
      setError("تعذّر التحقق. يرجى المحاولة مجدداً.");
      setStatus("idle");
    }
  }

  const isUnsafe = status === "done" && result && !result.hasActiveOfficialCall;

  return (
    <div className="card p-5 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: "#eaf3fb" }}
        >
          <PhoneCall className="w-5 h-5" style={{ color: "#1a5a9a" }} />
        </div>
        <div>
          <h3 className="font-black text-base" style={{ color: "#0d1b2a" }}>التحقق من مكالمة البنك</h3>
          <p className="text-xs mt-0.5 leading-relaxed" style={{ color: "#8090a0" }}>
            تحقق فوراً إذا كان الشخص المتصل يمثل البنك فعلياً.
          </p>
        </div>
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: "#edf0f4" }} />

      {/* Result area */}
      {status === "done" && result && (
        <div
          className="rounded-xl p-4 animate-fade-in flex gap-3"
          style={{
            background: isUnsafe ? "#fdf0ef" : "#eaf7ee",
            border: `1.5px solid ${isUnsafe ? "#f5c6c2" : "#b2dfc0"}`,
          }}
        >
          {isUnsafe
            ? <ShieldX  className="w-5 h-5 shrink-0 mt-0.5" style={{ color: "#c0392b" }} />
            : <ShieldCheck className="w-5 h-5 shrink-0 mt-0.5" style={{ color: "#1a7a4a" }} />
          }
          <div>
            <p className="text-sm font-black mb-1" style={{ color: isUnsafe ? "#c0392b" : "#1a7a4a" }}>
              {isUnsafe ? "تحذير: لا يوجد اتصال رسمي" : "الاتصال مُعتمد"}
            </p>
            <p className="text-xs leading-relaxed" style={{ color: isUnsafe ? "#7a2020" : "#1a4a2a" }}>
              {result.message}
            </p>
          </div>
        </div>
      )}

      {error && (
        <p className="text-xs text-center" style={{ color: "#c0392b" }}>{error}</p>
      )}

      {/* Action */}
      <button
        onClick={handleCheck}
        disabled={status === "loading"}
        className="btn-primary w-full"
        style={status === "done" && !isUnsafe ? { background: "#1a7a4a" } : {}}
      >
        {status === "loading"
          ? <><Loader2 className="w-4 h-4 animate-spin" /> جاري التحقق...</>
          : status === "done"
            ? <><RefreshCw className="w-4 h-4" /> إعادة الفحص</>
            : <><PhoneCall className="w-4 h-4" /> فحص الاتصال الآن</>
        }
      </button>
    </div>
  );
}
