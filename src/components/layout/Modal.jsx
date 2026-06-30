import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, Info } from "lucide-react";

const ICONS = {
  danger: { Icon: AlertTriangle, wrap: "bg-red-100 text-brand-red" },
  success: { Icon: CheckCircle2, wrap: "bg-green-100 text-brand-green" },
  info: { Icon: Info, wrap: "bg-blue-100 text-blue-600" },
};

const CONFIRM_BTN = {
  danger: "bg-brand-red hover:bg-red-800",
  success: "bg-brand-green hover:bg-green-800",
  info: "bg-brand-gold hover:bg-opacity-90",
};

export default function Modal({
  open,
  title,
  message,
  type = "info",
  showCancel = false,
  confirmText = "حسناً",
  onConfirm,
  onClose,
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (open) {
      const t = setTimeout(() => setVisible(true), 10);
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect -- resets entry animation state when modal closes
    setVisible(false);
  }, [open]);

  if (!open) return null;

  const { Icon, wrap } = ICONS[type] ?? ICONS.info;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-brand-dark transition-opacity duration-300 backdrop-blur-sm ${
        visible ? "bg-opacity-70 opacity-100" : "bg-opacity-0 opacity-0"
      }`}
    >
      <div
        className={`bg-white rounded-2xl shadow-2xl p-6 w-11/12 max-w-md transform transition-transform duration-300 ${
          visible ? "scale-100" : "scale-95"
        }`}
      >
        <div className="flex justify-center mb-4">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center text-3xl ${wrap}`}>
            <Icon className="w-8 h-8" />
          </div>
        </div>
        <h3 className="text-xl font-bold text-center text-brand-dark mb-2">{title}</h3>
        <p className="text-gray-600 text-center mb-6 text-sm leading-relaxed">{message}</p>
        <div className="flex gap-3 justify-center">
          {showCancel && (
            <button
              onClick={onClose}
              className="flex-1 px-5 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition"
            >
              إلغاء
            </button>
          )}
          <button
            onClick={() => {
              onConfirm?.();
              onClose?.();
            }}
            className={`${showCancel ? "flex-1" : "w-full"} px-5 py-2.5 rounded-xl text-white font-bold shadow-md transition ${CONFIRM_BTN[type]}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
