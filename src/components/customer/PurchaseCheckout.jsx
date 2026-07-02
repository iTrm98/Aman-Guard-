import { useState } from "react";
import { ShoppingCart, Loader2 } from "lucide-react";
import { analyzeTransaction } from "../../api/fraudService";
import { apiErrorMessage } from "../../api/client";
import { useApp } from "../../context/useApp";
import { UNAUTHORIZED_PURCHASE_PATTERN_AR } from "../../i18n/fraudPatterns";
import PurchaseInterceptionOverlay from "./PurchaseInterceptionOverlay";
import TransactionResult from "./TransactionResult";

const TX_TYPES = [
  { value: "online_purchase", key: "tx_type_online"   },
  { value: "transfer",        key: "tx_type_transfer" },
  { value: "bill_payment",    key: "tx_type_bill"     },
];

// Simulated purchase flow with AI risk gating:
//   allowed (low)        → TransactionResult green state
//   suspended (medium)   → PurchaseInterceptionOverlay (approve / stop)
//   blocked (high/crit)  → TransactionResult red final state, no override
export default function PurchaseCheckout({ onPurchaseFreeze, onPurchaseBlocked }) {
  const { t, showModal, currentUser } = useApp();
  const [merchantName, setMerchantName] = useState("");
  const [amount,       setAmount]       = useState("");
  const [merchantUrl,  setMerchantUrl]  = useState("");
  const [txType,       setTxType]       = useState(TX_TYPES[0].value);
  const [loading,      setLoading]      = useState(false);
  const [result,       setResult]       = useState(null);
  const [intercepted,  setIntercepted]  = useState(false);
  const [error,        setError]        = useState(null);

  const formValid = merchantName.trim() !== "" && Number(amount) > 0;
  const formDisabled = loading || (result !== null && !intercepted);

  function reset() {
    setMerchantName(""); setAmount(""); setMerchantUrl("");
    setTxType(TX_TYPES[0].value);
    setResult(null); setIntercepted(false); setError(null);
  }

  async function handleSubmit() {
    if (!formValid) return;
    setLoading(true); setError(null); setResult(null);
    try {
      const res = await analyzeTransaction({
        merchantName:    merchantName.trim(),
        amount:          Number(amount),
        currency:        "SAR",
        merchantUrl:     merchantUrl.trim() || null,
        transactionType: txType,
        accountId:       currentUser.accountId,
      });
      setResult(res);
      if (res.action === "suspended") setIntercepted(true);
      // Blocked: backend already created the case (and froze the account for
      // critical) — inject it into the bank dashboard, no overlay.
      if (res.action === "blocked") onPurchaseBlocked?.(res);
    } catch (err) {
      setError(apiErrorMessage(err, t("data_load_error")));
    } finally {
      setLoading(false);
    }
  }

  function handleConfirmed() {
    setIntercepted(false);
    reset();
    showModal({
      title:   t("tx_confirmed_title"),
      message: t("tx_confirmed_desc"),
      type:    "success",
    });
  }

  function handleStopped(caseId) {
    const stopped = {
      caseId,
      riskScore: result?.riskScore ?? 0,
      riskLevel: result?.riskLevel ?? "medium",
      findings:  [{ titleAr: UNAUTHORIZED_PURCHASE_PATTERN_AR }],
    };
    setIntercepted(false);
    reset();
    onPurchaseFreeze?.(stopped);
  }

  return (
    <div className="card" style={{ padding:20, display:"flex", flexDirection:"column", gap:16 }}>
      <div style={{ display:"flex", alignItems:"flex-start", gap:12 }}>
        <div style={{ width:40, height:40, borderRadius:12, background:"rgba(26,122,74,0.1)", border:"1px solid rgba(26,122,74,0.2)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
          <ShoppingCart style={{ width:18, height:18, color:"var(--green)" }} />
        </div>
        <div>
          <h3 style={{ fontWeight:900, fontSize:15, color:"var(--text-primary)", marginBottom:4 }}>{t("purchase_title")}</h3>
          <p style={{ fontSize:13, color:"var(--text-muted)", lineHeight:1.5 }}>{t("purchase_desc")}</p>
        </div>
      </div>

      <div style={{ height:1, background:"var(--border-subtle)" }} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        <div>
          <label style={{ display:"block", fontSize:12, fontWeight:700, color:"var(--text-muted)", marginBottom:6 }}>{t("merchant_name")}</label>
          <input type="text" value={merchantName} onChange={(e) => setMerchantName(e.target.value)} disabled={formDisabled} className="input-field" />
        </div>
        <div>
          <label style={{ display:"block", fontSize:12, fontWeight:700, color:"var(--text-muted)", marginBottom:6 }}>{t("amount")}</label>
          <input type="number" min="1" value={amount} onChange={(e) => setAmount(e.target.value)} disabled={formDisabled} className="input-field" style={{ direction:"ltr" }} />
        </div>
        <div>
          <label style={{ display:"block", fontSize:12, fontWeight:700, color:"var(--text-muted)", marginBottom:6 }}>{t("merchant_url")}</label>
          <input type="text" value={merchantUrl} onChange={(e) => setMerchantUrl(e.target.value)} disabled={formDisabled} className="input-field" style={{ direction:"ltr" }} placeholder="https://" />
        </div>
        <div>
          <label style={{ display:"block", fontSize:12, fontWeight:700, color:"var(--text-muted)", marginBottom:6 }}>{t("transaction_type")}</label>
          <select value={txType} onChange={(e) => setTxType(e.target.value)} disabled={formDisabled} className="input-field">
            {TX_TYPES.map((opt) => (
              <option key={opt.value} value={opt.value}>{t(opt.key)}</option>
            ))}
          </select>
        </div>
      </div>

      {loading && (
        <div style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 14px", borderRadius:10, background:"rgba(196,154,90,0.07)", border:"1px solid rgba(196,154,90,0.15)", fontSize:13, color:"#8a6030" }}>
          <Loader2 style={{ width:16, height:16, flexShrink:0, color:"var(--gold)" }} className="animate-spin" />
          {t("ai_verifying")}
        </div>
      )}

      {error && <p style={{ fontSize:12, textAlign:"center", color:"var(--red)" }}>{error}</p>}

      {result && !intercepted && result.action !== "suspended" && (
        <TransactionResult result={result} onReset={reset} />
      )}

      {(!result || intercepted) && (
        <button onClick={handleSubmit} disabled={loading || !formValid} className="btn-primary" style={{ width:"100%" }}>
          <ShoppingCart style={{ width:16, height:16 }} />
          {t("proceed_transaction")}
        </button>
      )}

      {intercepted && result && (
        <PurchaseInterceptionOverlay
          transaction={{ ...result, merchantName: merchantName.trim(), amount: Number(amount) }}
          onConfirmed={handleConfirmed}
          onStopped={handleStopped}
        />
      )}
    </div>
  );
}
