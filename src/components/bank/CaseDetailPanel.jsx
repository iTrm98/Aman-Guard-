import { useState } from "react";
import { X, ShieldAlert, ArrowUpCircle, Trash2, Phone, Pencil, Save, Loader2 } from "lucide-react";
import { useApp } from "../../context/useApp";
import { freezeCaseByStaff, updateCase } from "../../api/fraudService";
import { apiErrorMessage } from "../../api/client";
import { useRelativeTime } from "../../hooks/useRelativeTime";
import { FRAUD_PATTERNS, displayFraudPattern, riskLevelFromScore } from "../../i18n/fraudPatterns";

const RISK_COLOR = { critical:"var(--red)", high:"#d35400", medium:"#9a7d0a", low:"#9a7d0a" };
const RISK_LABEL_KEY = { critical:"risk_critical", high:"risk_high", medium:"risk_medium", low:"risk_low" };

const STATUS_OPTIONS = [
  { value: "active",               tKey: "status_active"  },
  { value: "partially_restricted", tKey: "status_partial" },
  { value: "frozen",               tKey: "status_frozen"  },
];

export default function CaseDetailPanel({ caseData, onClose, onAction }) {
  const { t, lang, showModal, closeModal } = useApp();
  // Local copy so officer edits are reflected immediately after save without
  // waiting for the parent table's state to round-trip. The panel is keyed
  // by caseId in BankView, so this initializes fresh per case.
  const [current, setCurrent] = useState(caseData);
  const [editing, setEditing] = useState(false);
  const [draft,   setDraft]   = useState(null);
  const [saving,  setSaving]  = useState(false);
  const [saveError, setSaveError] = useState(null);
  const timeAgo = useRelativeTime(current?.createdAt);

  if (!current) return null;

  const displayScore = editing && draft ? Number(draft.riskScore || 0) : current.riskScore;
  const displayLevel = editing ? riskLevelFromScore(displayScore) : current.riskLevel;
  const riskColor = RISK_COLOR[displayLevel] ?? "#9a7d0a";

  function startEdit() {
    setDraft({
      customerName:  current.customerName ?? "",
      fraudPattern:  current.fraudPattern ?? "",
      riskScore:     current.riskScore,
      accountStatus: current.accountStatus ?? "active",
      notes:         current.notes ?? "",
    });
    setSaveError(null);
    setEditing(true);
  }

  async function handleSave() {
    const score = Number(draft.riskScore);
    if (Number.isNaN(score) || score < 0 || score > 100) {
      setSaveError(t("required_fields_msg"));
      return;
    }
    setSaving(true);
    setSaveError(null);
    try {
      const updated = await updateCase(current.caseId, {
        customerName:  draft.customerName.trim(),
        fraudPattern:  draft.fraudPattern,
        riskScore:     score,
        accountStatus: draft.accountStatus,
        notes:         draft.notes,
      });
      setCurrent(updated);
      setEditing(false);
      onAction?.("updated", updated);
      showModal({ title: t("case_updated_title"), message: t("case_updated_msg"), type: "success" });
      setTimeout(closeModal, 2000);
    } catch (err) {
      setSaveError(apiErrorMessage(err, t("case_update_error")));
    } finally {
      setSaving(false);
    }
  }

  function handleEscalate() {
    showModal({
      title: t("escalate_title"), message: t("escalate_msg"),
      type:"info", showCancel:true, confirmText: t("escalate_btn"),
      onConfirm: () => { onAction?.("escalated", current); onClose(); },
    });
  }

  function handleDismiss() {
    showModal({
      title: t("dismiss_title"), message: t("dismiss_msg"),
      type:"info", showCancel:true, confirmText: t("dismiss_btn"),
      onConfirm: () => { onAction?.("dismissed", current); onClose(); },
    });
  }

  function handleFreezeAndCall() {
    showModal({
      title: t("case_freeze_action"), message: t("freeze_confirm_msg"),
      type:"danger", showCancel:true, confirmText: t("freeze_confirm_btn"),
      onConfirm: async () => {
        await freezeCaseByStaff({
          caseId:          current.caseId,
          freezeRequestId: current.freezeRequestId,
          freezeStatus:    current.freezeStatus,
        });
        onAction?.("frozen", current);
        onClose();
      },
    });
  }

  const detailRows = [
    { label: t("case_id"),         val: `#${current.id}` },
    { label: t("col_client"),      val: current.customerName, editable: "customerName" },
    { label: t("case_reported_at"),val: timeAgo },
    { label: t("case_status"),     val: t({ active:"status_active", frozen:"status_frozen", partially_restricted:"status_partial" }[current.accountStatus] ?? "status_active"), editable: "accountStatus" },
  ];

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
            <p style={{ fontSize:12, color:"var(--text-muted)", marginTop:2 }}>#{current.id}</p>
          </div>
          <div style={{ display:"flex", gap:8 }}>
            {editing ? (
              <button onClick={handleSave} disabled={saving} className="btn-primary" style={{ padding:"6px 12px", fontSize:12 }}>
                {saving ? <Loader2 className="animate-spin" style={{ width:13, height:13 }} /> : <Save style={{ width:13, height:13 }} />}
                {saving ? t("saving") : t("save_case")}
              </button>
            ) : (
              <button onClick={startEdit} className="btn-ghost" style={{ padding:"6px 12px", fontSize:12 }}>
                <Pencil style={{ width:13, height:13 }} />
                {t("edit_case")}
              </button>
            )}
            <button onClick={onClose} style={{ background:"var(--bg-surface)", border:"1px solid var(--border)", borderRadius:8, padding:6, cursor:"pointer", color:"var(--text-muted)" }}>
              <X style={{ width:14, height:14 }} />
            </button>
          </div>
        </div>

        <div style={{ flex:1, overflowY:"auto" }}>
          {/* Risk score hero — updates live while the officer edits the score */}
          <div style={{ padding:20, borderBottom:"1px solid var(--border-subtle)" }}>
            <div style={{ display:"flex", alignItems:"center", gap:16 }}>
              <div style={{ width:72, height:72, borderRadius:"50%", border:`4px solid ${riskColor}`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, background:`${riskColor}15`, transition:"border-color 0.2s" }}>
                <span style={{ fontWeight:900, fontSize:22, color:riskColor }}>{displayScore}</span>
              </div>
              <div style={{ flex:1 }}>
                <p style={{ fontSize:12, color:"var(--text-muted)", marginBottom:4 }}>{t("case_risk")}</p>
                <p style={{ fontWeight:900, fontSize:18, color:riskColor }}>{t(RISK_LABEL_KEY[displayLevel] ?? "risk_medium")}</p>
                {editing ? (
                  <div style={{ display:"flex", flexDirection:"column", gap:8, marginTop:8 }}>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={draft.riskScore}
                      onChange={(e) => setDraft((d) => ({ ...d, riskScore: e.target.value }))}
                      className="input-field"
                      style={{ maxWidth:120, paddingTop:6, paddingBottom:6 }}
                    />
                    <select
                      value={draft.fraudPattern}
                      onChange={(e) => setDraft((d) => ({ ...d, fraudPattern: e.target.value }))}
                      className="input-field"
                      style={{ paddingTop:6, paddingBottom:6 }}
                    >
                      {!FRAUD_PATTERNS.some((p) => p.ar === draft.fraudPattern) && draft.fraudPattern && (
                        <option value={draft.fraudPattern}>{displayFraudPattern(draft.fraudPattern, lang)}</option>
                      )}
                      {FRAUD_PATTERNS.map((p) => (
                        <option key={p.ar} value={p.ar}>{lang === "en" ? p.en : p.ar}</option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <p style={{ fontSize:12, color:"var(--text-secondary)", marginTop:2 }}>{displayFraudPattern(current.fraudPattern, lang)}</p>
                )}
              </div>
            </div>
          </div>

          {/* Details grid */}
          <div style={{ padding:20, borderBottom:"1px solid var(--border-subtle)" }}>
            <p style={{ fontSize:11, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.08em", color:"var(--text-muted)", marginBottom:12 }}>{t("case_detail_title")}</p>
            {detailRows.map(({ label, val, editable }) => (
              <div key={label} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", gap:12, padding:"8px 0", borderBottom:"1px solid var(--border-subtle)", fontSize:13 }}>
                <span style={{ color:"var(--text-muted)", flexShrink:0 }}>{label}</span>
                {editing && editable === "customerName" ? (
                  <input
                    value={draft.customerName}
                    onChange={(e) => setDraft((d) => ({ ...d, customerName: e.target.value }))}
                    className="input-field"
                    style={{ maxWidth:200, paddingTop:5, paddingBottom:5, fontSize:13 }}
                  />
                ) : editing && editable === "accountStatus" ? (
                  <select
                    value={draft.accountStatus}
                    onChange={(e) => setDraft((d) => ({ ...d, accountStatus: e.target.value }))}
                    className="input-field"
                    style={{ maxWidth:200, paddingTop:5, paddingBottom:5, fontSize:13 }}
                  >
                    {STATUS_OPTIONS.map(({ value, tKey }) => (
                      <option key={value} value={value}>{t(tKey)}</option>
                    ))}
                  </select>
                ) : (
                  <span style={{ color:"var(--text-primary)", fontWeight:700 }}>{val}</span>
                )}
              </div>
            ))}
          </div>

          {/* Notes */}
          {(editing || current.notes) && (
            <div style={{ padding:20, borderBottom:"1px solid var(--border-subtle)" }}>
              <p style={{ fontSize:11, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.08em", color:"var(--text-muted)", marginBottom:12 }}>{t("case_notes")}</p>
              {editing ? (
                <textarea
                  value={draft.notes}
                  onChange={(e) => setDraft((d) => ({ ...d, notes: e.target.value }))}
                  rows={3}
                  className="input-field"
                  style={{ resize:"none", fontSize:13 }}
                />
              ) : (
                <p style={{ fontSize:13, lineHeight:1.6, color:"var(--text-secondary)", whiteSpace:"pre-wrap" }}>{current.notes}</p>
              )}
            </div>
          )}

          {saveError && (
            <p style={{ fontSize:12, color:"var(--red)", textAlign:"center", padding:"10px 20px" }}>{saveError}</p>
          )}

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
