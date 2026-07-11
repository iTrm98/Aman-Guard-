import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, Info, X } from "lucide-react";
import { useApp } from "../../context/useApp";

const CONFIG = {
  danger:  { Icon: AlertTriangle, accent: "var(--red)",   iconBg: "rgba(192,57,43,0.1)"  },
  success: { Icon: CheckCircle2,  accent: "var(--green)",  iconBg: "rgba(26,122,74,0.1)"  },
  info:    { Icon: Info,          accent: "#1a5a9a",        iconBg: "rgba(26,90,154,0.1)"  },
};

export default function Modal({ open, title, message, type = "info", showCancel = false, confirmText, onConfirm, onClose }) {
  const { t } = useApp();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (open) { const id = setTimeout(() => setVisible(true), 10); return () => clearTimeout(id); }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setVisible(false);
  }, [open]);

  if (!open) return null;
  const { Icon, accent, iconBg } = CONFIG[type] ?? CONFIG.info;

  return (
    <div
      onClick={onClose}
      style={{
        position:"fixed",inset:0,zIndex:60,display:"flex",alignItems:"center",justifyContent:"center",
        background: visible ? "rgba(13,27,42,0.65)" : "rgba(13,27,42,0)",
        backdropFilter:"blur(4px)", transition:"background 0.3s",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width:"min(420px,94vw)", background:"var(--bg-surface)",
          borderRadius:20, overflow:"hidden",
          boxShadow:"var(--shadow-modal)", border:"1px solid var(--border)",
          transform: visible ? "scale(1) translateY(0)" : "scale(0.95) translateY(14px)",
          opacity: visible ? 1 : 0, transition:"transform 0.3s ease, opacity 0.3s ease",
        }}
      >
        <div style={{ height:4, background:accent }} />
        <div style={{ padding:24 }}>
          <button onClick={onClose} style={{ position:"absolute",top:16,insetInlineEnd:16, background:"var(--bg-subtle)", border:"1px solid var(--border)", borderRadius:8, padding:6, cursor:"pointer", color:"var(--text-muted)" }}>
            <X style={{ width:14,height:14 }} />
          </button>
          <div style={{ width:56,height:56,borderRadius:16,background:iconBg,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 16px" }}>
            <Icon style={{ width:28,height:28,color:accent }} />
          </div>
          <p style={{ fontWeight:900,fontSize:18,textAlign:"center",color:"var(--text-primary)",marginBottom:8 }}>{title}</p>
          <p style={{ fontSize:14,textAlign:"center",lineHeight:1.7,color:"var(--text-secondary)",marginBottom:24 }}>{message}</p>
          <div style={{ display:"flex",gap:10 }}>
            {showCancel && (
              <button onClick={onClose} className="btn-ghost" style={{ flex:1 }}>{t("cancel")}</button>
            )}
            <button
              onClick={() => { onConfirm?.(); onClose?.(); }}
              className={type === "danger" ? "btn-danger" : "btn-primary"}
              style={{ flex:1, background: type !== "danger" ? accent : undefined }}
            >
              {confirmText ?? t("ok")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
