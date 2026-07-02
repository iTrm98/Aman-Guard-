import { useState } from "react";
import { X, FilePlus2, Loader2 } from "lucide-react";
import { useApp } from "../../context/AppContext";
import { createCase, getCustomerByNationalId } from "../../api/fraudService";
import { apiErrorMessage, ApiError } from "../../api/client";
import { FRAUD_PATTERNS } from "../../i18n/fraudPatterns";

const EMPTY_FORM = {
  nationalId: "",
  customerName: "",
  accountNumber: "",
  phone: "",
  fraudPattern: "",
  description: "",
  riskScore: "",
  immediateAction: "",
};

const ACTIONS = [
  { value: "monitor", labelKey: "action_monitor" },
  { value: "freeze",  labelKey: "action_freeze_precautionary" },
  { value: "close",   labelKey: "action_close_immediate" },
];

// Top-level (not nested in the panel) so React doesn't remount the field —
// and drop input focus — on every keystroke.
function Field({ label, children }) {
  return (
    <div>
      <label style={{ display:"block", fontSize:12, fontWeight:700, color:"var(--text-muted)", marginBottom:6 }}>{label}</label>
      {children}
    </div>
  );
}

export default function AddCasePanel({ onClose, onCreated }) {
  const { t, lang } = useApp();
  const [form, setForm] = useState(EMPTY_FORM);
  const [fieldErrors, setFieldErrors] = useState({});
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  function setField(name, value) {
    setForm((prev) => ({ ...prev, [name]: value }));
    setFieldErrors((prev) => ({ ...prev, [name]: false }));
  }

  async function handleNationalIdBlur() {
    const nationalId = form.nationalId.trim();
    if (!nationalId) return;
    setLookupLoading(true);
    setLookupError(null);
    try {
      const customer = await getCustomerByNationalId(nationalId);
      setForm((prev) => ({
        ...prev,
        customerName:  customer.name ?? prev.customerName,
        accountNumber: customer.accountNumber ?? prev.accountNumber,
        phone:         customer.phone ?? prev.phone,
      }));
      setFieldErrors((prev) => ({ ...prev, customerName: false }));
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        setLookupError(t("customer_not_found"));
      } else {
        setLookupError(apiErrorMessage(err, t("data_load_error")));
      }
    } finally {
      setLookupLoading(false);
    }
  }

  function validate() {
    const score = Number(form.riskScore);
    const errors = {
      nationalId:      !form.nationalId.trim(),
      customerName:    !form.customerName.trim(),
      fraudPattern:    !form.fraudPattern,
      riskScore:       form.riskScore === "" || Number.isNaN(score) || score < 0 || score > 100,
      immediateAction: !form.immediateAction,
    };
    setFieldErrors(errors);
    return !Object.values(errors).some(Boolean);
  }

  async function handleSubmit() {
    setSubmitError(null);
    if (!validate()) {
      setSubmitError(t("required_fields_msg"));
      return;
    }
    setSubmitting(true);
    try {
      const created = await createCase({
        nationalId:      form.nationalId.trim(),
        customerName:    form.customerName.trim(),
        accountNumber:   form.accountNumber.trim(),
        phone:           form.phone.trim(),
        fraudPattern:    form.fraudPattern,
        description:     form.description.trim(),
        riskScore:       Number(form.riskScore),
        immediateAction: form.immediateAction,
      });
      onCreated?.(created);
    } catch (err) {
      setSubmitError(apiErrorMessage(err, t("add_case_error")));
    } finally {
      setSubmitting(false);
    }
  }

  const errorBorder = (name) => (fieldErrors[name] ? { borderColor: "var(--red)" } : {});

  return (
    <>
      <div className="panel-overlay" onClick={onClose} />
      <div className="panel-drawer animate-slide-in">
        {/* Header */}
        <div style={{ padding:"16px 20px", borderBottom:"1px solid var(--border)", display:"flex", alignItems:"center", justifyContent:"space-between", flexShrink:0, background:"var(--bg-subtle)" }}>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <FilePlus2 style={{ width:16, height:16, color:"var(--gold)" }} />
            <span style={{ fontWeight:900, fontSize:15, color:"var(--text-primary)" }}>{t("add_case_title")}</span>
          </div>
          <button onClick={onClose} style={{ background:"var(--bg-surface)", border:"1px solid var(--border)", borderRadius:8, padding:6, cursor:"pointer", color:"var(--text-muted)" }}>
            <X style={{ width:14, height:14 }} />
          </button>
        </div>

        {/* Form */}
        <div style={{ flex:1, overflowY:"auto", padding:20, display:"flex", flexDirection:"column", gap:14 }}>
          <Field label={t("field_national_id")}>
            <div style={{ position:"relative" }}>
              <input
                value={form.nationalId}
                onChange={(e) => setField("nationalId", e.target.value)}
                onBlur={handleNationalIdBlur}
                className="input-field"
                style={errorBorder("nationalId")}
              />
              {lookupLoading && (
                <Loader2 className="animate-spin" style={{ width:14, height:14, position:"absolute", insetInlineEnd:12, top:"50%", transform:"translateY(-50%)", color:"var(--text-muted)" }} />
              )}
            </div>
            {lookupError && <p style={{ fontSize:11, color:"var(--red)", marginTop:4 }}>{lookupError}</p>}
          </Field>

          <Field label={t("field_customer_name")}>
            <input
              value={form.customerName}
              onChange={(e) => setField("customerName", e.target.value)}
              className="input-field"
              style={errorBorder("customerName")}
            />
          </Field>

          <Field label={t("field_account_number")}>
            <input
              value={form.accountNumber}
              onChange={(e) => setField("accountNumber", e.target.value)}
              className="input-field"
            />
          </Field>

          <Field label={t("field_phone")}>
            <input
              value={form.phone}
              onChange={(e) => setField("phone", e.target.value)}
              className="input-field"
            />
          </Field>

          <Field label={t("field_fraud_pattern")}>
            <select
              value={form.fraudPattern}
              onChange={(e) => setField("fraudPattern", e.target.value)}
              className="input-field"
              style={errorBorder("fraudPattern")}
            >
              <option value="">{t("select_pattern_ph")}</option>
              {FRAUD_PATTERNS.map((p) => (
                <option key={p.ar} value={p.ar}>{lang === "en" ? p.en : p.ar}</option>
              ))}
            </select>
          </Field>

          <Field label={t("field_description")}>
            <textarea
              value={form.description}
              onChange={(e) => setField("description", e.target.value)}
              rows={3}
              className="input-field"
              style={{ resize:"none" }}
            />
          </Field>

          <Field label={t("field_manual_risk")}>
            <input
              type="number"
              min={0}
              max={100}
              value={form.riskScore}
              onChange={(e) => setField("riskScore", e.target.value)}
              className="input-field"
              style={errorBorder("riskScore")}
            />
          </Field>

          <Field label={t("field_immediate_action")}>
            <div
              style={{ display:"flex", flexDirection:"column", gap:8, padding:12, borderRadius:10, border:`1px solid ${fieldErrors.immediateAction ? "var(--red)" : "var(--border)"}`, background:"var(--bg-subtle)" }}
            >
              {ACTIONS.map(({ value, labelKey }) => (
                <label key={value} style={{ display:"flex", alignItems:"center", gap:8, cursor:"pointer", fontSize:13, color:"var(--text-primary)" }}>
                  <input
                    type="radio"
                    name="immediateAction"
                    value={value}
                    checked={form.immediateAction === value}
                    onChange={() => setField("immediateAction", value)}
                  />
                  {t(labelKey)}
                </label>
              ))}
            </div>
          </Field>

          {submitError && (
            <p style={{ fontSize:12, color:"var(--red)", textAlign:"center" }}>{submitError}</p>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding:"14px 20px", borderTop:"1px solid var(--border)", flexShrink:0 }}>
          <button onClick={handleSubmit} disabled={submitting} className="btn-primary" style={{ width:"100%", padding:"12px 16px" }}>
            {submitting
              ? <><Loader2 className="animate-spin" style={{ width:16, height:16 }} />{t("saving")}</>
              : <><FilePlus2 style={{ width:16, height:16 }} />{t("add_case_submit")}</>
            }
          </button>
        </div>
      </div>
    </>
  );
}
