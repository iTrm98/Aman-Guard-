import { ShieldCheck, Lock, Eye, EyeOff } from "lucide-react";
import { useState } from "react";

export default function AccountCard() {
  const [showBalance, setShowBalance] = useState(false);

  return (
    <div
      className="relative overflow-hidden rounded-2xl p-6 text-white"
      style={{
        background: "linear-gradient(135deg, #0d1b2a 0%, #162032 55%, #1e2d42 100%)",
        border: "1px solid #1e2f42",
        minHeight: 180,
      }}
    >
      {/* Decorative circles */}
      <div
        className="absolute -top-12 -left-12 w-48 h-48 rounded-full opacity-10"
        style={{ background: "#c49a5a" }}
      />
      <div
        className="absolute -bottom-8 left-24 w-32 h-32 rounded-full opacity-5"
        style={{ background: "#c49a5a" }}
      />

      <div className="relative flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="live-dot" />
            <span className="text-xs font-semibold" style={{ color: "#8da0b3" }}>
              الحساب الجاري الرئيسي
            </span>
          </div>
          <p className="text-xs mb-4" style={{ color: "#4a6070" }}>SA•• •••• •••• •••• 4821</p>

          <div className="flex items-end gap-3">
            <div>
              <p className="text-xs mb-1" style={{ color: "#8da0b3" }}>الرصيد المتاح</p>
              <p className="text-2xl font-black tracking-tight" style={{ letterSpacing: "-0.02em" }}>
                {showBalance ? "٤٨,٣٢١.٥٠ ر.س" : "••••••• ر.س"}
              </p>
            </div>
            <button
              onClick={() => setShowBalance((v) => !v)}
              className="mb-1 p-1.5 rounded-lg transition"
              style={{ background: "rgba(255,255,255,0.08)" }}
            >
              {showBalance
                ? <EyeOff className="w-4 h-4" style={{ color: "#8da0b3" }} />
                : <Eye    className="w-4 h-4" style={{ color: "#8da0b3" }} />
              }
            </button>
          </div>
        </div>

        {/* Security status badge */}
        <div className="text-left">
          <div
            className="flex items-center gap-2 px-3 py-2 rounded-xl mb-2"
            style={{ background: "rgba(196,154,90,0.12)", border: "1px solid rgba(196,154,90,0.25)" }}
          >
            <ShieldCheck className="w-4 h-4" style={{ color: "#c49a5a" }} />
            <span className="text-xs font-bold" style={{ color: "#c49a5a" }}>محمي</span>
          </div>
          <div
            className="flex items-center gap-2 px-3 py-2 rounded-xl"
            style={{ background: "rgba(26,122,74,0.12)", border: "1px solid rgba(26,122,74,0.25)" }}
          >
            <Lock className="w-3.5 h-3.5" style={{ color: "#27ae60" }} />
            <span className="text-xs font-semibold" style={{ color: "#27ae60" }}>نشط</span>
          </div>
        </div>
      </div>

      {/* Quick stats row */}
      <div
        className="relative mt-5 pt-4 flex gap-6"
        style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}
      >
        {[
          { label: "عمليات اليوم",      value: "٣",     note: "+٢ مقارنة بالأمس" },
          { label: "فحوصات الأمان",    value: "١٢",    note: "آخر ٣٠ يوم" },
          { label: "تهديدات مُوقفة",  value: "٧",     note: "هذا الشهر" },
        ].map(({ label, value, note }) => (
          <div key={label}>
            <p className="text-xs" style={{ color: "#4a6070" }}>{label}</p>
            <p className="text-lg font-black" style={{ color: "#c49a5a" }}>{value}</p>
            <p className="text-xs" style={{ color: "#304050" }}>{note}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
