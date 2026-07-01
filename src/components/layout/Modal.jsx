import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, Info, X } from "lucide-react";

const CONFIG = {
  danger:  { Icon: AlertTriangle, accent: "#c0392b", bg: "#fdf0ef", iconBg: "#fde8e6" },
  success: { Icon: CheckCircle2,  accent: "#1a7a4a", bg: "#eaf7ee", iconBg: "#d4f0de" },
  info:    { Icon: Info,          accent: "#1a5a9a", bg: "#eaf3fb", iconBg: "#d4e8f7" },
};

export default function Modal({
  open, title, message, type = "info",
  showCancel = false, confirmText = "حسناً",
  onConfirm, onClose,
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (open) {
      const t = setTimeout(() => setVisible(true), 10);
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setVisible(false);
  }, [open]);

  if (!open) return null;

  const { Icon, accent, iconBg } = CONFIG[type] ?? CONFIG.info;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center transition-all duration-300"
      style={{ background: visible ? "rgba(13,27,42,0.65)" : "rgba(13,27,42,0)", backdropFilter: "blur(4px)" }}
    >
      <div
        className="relative w-11/12 max-w-md rounded-2xl overflow-hidden transition-all duration-300"
        style={{
          background: "#fff",
          boxShadow: "0 24px 64px rgba(13,27,42,0.22)",
          transform: visible ? "scale(1) translateY(0)" : "scale(0.96) translateY(12px)",
          opacity: visible ? 1 : 0,
        }}
      >
        {/* Top accent bar */}
        <div style={{ height: 4, background: accent }} />

        <div className="p-6">
          {/* Close */}
          <button
            onClick={onClose}
            className="absolute top-5 left-5 rounded-lg p-1 transition"
            style={{ color: "#8090a0" }}
          >
            <X className="w-4 h-4" />
          </button>

          {/* Icon */}
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ background: iconBg }}
          >
            <Icon className="w-7 h-7" style={{ color: accent }} />
          </div>

          <h3 className="text-xl font-black text-center mb-2" style={{ color: "#0d1b2a" }}>{title}</h3>
          <p className="text-sm text-center leading-relaxed mb-6" style={{ color: "#5a6a7a" }}>{message}</p>

          <div className="flex gap-3">
            {showCancel && (
              <button onClick={onClose} className="btn-ghost flex-1">إلغاء</button>
            )}
            <button
              onClick={() => { onConfirm?.(); onClose?.(); }}
              className={`flex-1 ${type === "danger" ? "btn-danger" : "btn-primary"}`}
              style={type !== "danger" ? { background: accent } : {}}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
