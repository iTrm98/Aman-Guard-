import { X, ShieldAlert, ArrowUpCircle, Trash2, Phone } from "lucide-react";
import { useApp } from "../../context/AppContext";

const RISK_COLOR = { critical:"var(--red)", high:"#d35400", medium:"#9a7d0a" };

export default function CaseDetailPanel({ caseData, onClose, onAction }) {
  const { t, showModal } = useApp();
  if (!caseData) return null;

  const riskColor = RISK_COLOR[caseData.riskLevel] ?? "#9a7d0a";

  function handleEscalate() {
    showModal({
      title: t("escalate_title"), message: t("escalate_msg"),
      type:"info", showCancel:true, confirmText: t("escalate_btn"),
      onConfirm: () => { onAction?.("escalated", caseData); onClose(); },
    });
  }

  function handleDismiss() {
    showModal({
      title: t("dismiss_title"), message: t("dismiss_msg"),
      type:"info", showCancel:true, confirmText: t("dismiss_btn"),
      onConfirm: () => { onAction?.("dismissed", caseData); onClose(); },
    });
  }

  function handleFreezeAndCall() {
    showModal({
      title: t("case_freeze_action"), message: t("freeze_confirm_msg"),
      type:"danger", showCancel:true, confirmText: t("freeze_confirm_btn"),
      onConfirm: () => { onAction?.("frozen", caseData); onClose(); },
    });
  }

  return (
    <>
      <div className="panel-overlay" onClick={onClose} />
      <div className="panel-drawer animate-slide-in">
        {/* Header */}
        <div style={{ padding:"16px 20px", borderBottom:"1px solid var(--border)", display:"flex", alignItems:"center", justifyContent:"space-between", flexShrink:0, background:"var(--bg-subtle)" }}>
          <div>
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <ShieldAlert style={{ width:16, height:16, color:riskColor }} />
              <span style={{ fontWeight:900, fontSize:15, color:"var(--text-primary)" }}>{t("case_detail_title")}</span>
            </div>
            <p style={{ fontSize:12, color:"var(--text-muted)", marginTop:2 }}>#{caseData.id}</p>
          </div>
          <button onClick={onClose} style={{ background:"var(--bg-surface)", border:"1px solid var(--border)", borderRadius:8, padding:6, cursor:"pointer", color:"var(--text-muted)" }}>
            <X style={{ width:14, height:14 }} />
          </button>
        </div>

        <div style={{ flex:1, overflowY:"auto" }}>
          {/* Risk score hero */}
          <div style={{ padding:20, borderBottom:"1px solid var(--border-subtle)" }}>
            <div style={{ display:"flex", alignItems:"center", gap:16 }}>
              <div style={{ width:72, height:72, borderRadius:"50%", border:`4px solid ${riskColor}`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, background:`${riskColor}15` }}>
                <span style={{ fontWeight:900, fontSize:22, color:riskColor }}>{caseData.riskScore}</span>
              </div>
              <div>
                <p style={{ fontSize:12, color:"var(--text-muted)", marginBottom:4 }}>{t("case_risk")}</p>
                <p style={{ fontWeight:900, fontSize:18, color:riskColor }}>{t(`risk_${caseData.riskLevel}`)}</p>
                <p style={{ fontSize:12, color:"var(--text-secondary)", marginTop:2 }}>{caseData.fraudPattern}</p>
              </div>
            </div>
          </div>

          {/* Details grid */}
          <div style={{ padding:20, borderBottom:"1px solid var(--border-subtle)" }}>
            <p style={{ fontSize:11, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.08em", color:"var(--text-muted)", marginBottom:12 }}>{t("case_detail_title")}</p>
            {[
              { label: t("case_id"),          val: `#${caseData.id}` },
              { label: t("col_client"),        val: caseData.customerName },
              { label: t("case_reported_at"),  val: caseData.timeAgo },
              { label: t("case_status"),       val: t({ active:"status_active", frozen:"status_frozen", partially_restricted:"status_partial" }[caseData.accountStatus] ?? "status_active") },
            ].map(({ label, val }) => (
              <div key={label} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"8px 0", borderBottom:"1px solid var(--border-subtle)", fontSize:13 }}>
                <span style={{ color:"var(--text-muted)" }}>{label}</span>
                <span style={{ color:"var(--text-primary)", fontWeight:700 }}>{val}</span>
              </div>
            ))}
          </div>

          {/* Timeline */}
          <div style={{ padding:20, borderBottom:"1px solid var(--border-subtle)" }}>
            <p style={{ fontSize:11, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.08em", color:"var(--text-muted)", marginBottom:14 }}>{t("case_timeline")}</p>
            {[
              { icon:"🔍", text: t("timeline_flagged"),  time:"00:00" },
              { icon:"🤖", text: t("timeline_analyzed"), time:"00:02" },
              { icon:"📢", text: t("timeline_notified"), time:"00:03" },
            ].map(({ icon, text, time }, i) => (
              <div key={i} style={{ display:"flex", gap:12, marginBottom:14 }}>
                <div style={{ display:"flex", flexDirection:"column", alignItems:"center" }}>
                  <span style={{ fontSize:18 }}>{icon}</span>
                  {i < 2 && <div style={{ width:2, flex:1, background:"var(--border-subtle)", margin:"4px 0" }} />}
                </div>
                <div>
                  <p style={{ fontSize:13, color:"var(--text-primary)", fontWeight:600, lineHeight:1.4 }}>{text}</p>
                  <p style={{ fontSize:11, color:"var(--text-muted)", marginTop:2 }}>+{time} {t("case_reported_at")}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div style={{ padding:20 }}>
            <p style={{ fontSize:11, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.08em", color:"var(--text-muted)", marginBottom:12 }}>{t("case_actions")}</p>
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              <button onClick={handleFreezeAndCall} className="btn-danger" style={{ width:"100%", padding:"12px 16px", borderRadius:12, justifyContent:"flex-start", gap:10 }}>
                <Phone style={{ width:16, height:16 }} />
                {t("case_freeze_action")}
              </button>
              <button onClick={handleEscalate} className="btn-ghost" style={{ width:"100%", padding:"11px 16px", borderRadius:12, justifyContent:"flex-start", gap:10, color:"#d35400", borderColor:"#fad7b0" }}>
                <ArrowUpCircle style={{ width:16, height:16 }} />
                {t("case_escalate")}
              </button>
              <button onClick={handleDismiss} className="btn-ghost" style={{ width:"100%", padding:"11px 16px", borderRadius:12, justifyContent:"flex-start", gap:10 }}>
                <Trash2 style={{ width:16, height:16 }} />
                {t("case_dismiss")}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
