// Shared fraud-pattern definitions and the single source of truth for turning a
// stored fraud-pattern value into a human-readable bilingual label.
//
// The backend stores fraud_pattern in TWO shapes, so the map below covers both:
//   1. UPPER_SNAKE_CASE keys — the V2 seed data (e.g. "BANK_SUPPORT_OTP") and the
//      realtime test controller. Language-neutral, never shown to a user raw.
//   2. Arabic strings — produced at runtime by DashboardServiceImpl.detectFraudPattern,
//      the transaction flow, and manual officer entry (the dropdown below).
// displayFraudPattern() must always return a readable label, never a raw key.

// Options offered to bank officers in dropdowns (AddCasePanel, CaseDetailPanel
// edit mode). The Arabic string is what gets stored on the case.
export const FRAUD_PATTERNS = [
  { ar: "رابط وهمي",          en: "Fake Link / Phishing"      },
  { ar: "احتيال OTP",         en: "OTP Fraud"                 },
  { ar: "متجر وهمي",          en: "Fake Store"                },
  { ar: "استثمار وهمي",       en: "Fake Investment"           },
  { ar: "انتحال صفة بنك",     en: "Bank Impersonation"        },
  { ar: "ابتزاز إلكتروني",    en: "Electronic Extortion"      },
  { ar: "احتيال شحنة",        en: "Delivery / Shipment Fraud" },
  { ar: "أخرى",               en: "Other"                     },
];

// UPPER_SNAKE_CASE keys emitted by the backend seed data (V2) and the AI engine /
// future detectors. Every value is a bilingual { ar, en } label.
const SNAKE_CASE_PATTERNS = {
  // --- Present in the V2 seed data (fraud_cases.fraud_pattern) ---
  BANK_SUPPORT_OTP:               { ar: "دعم بنكي وهمي — طلب OTP",           en: "Fake Bank Support — OTP Request" },
  OTP_REQUEST_BANK_IMPERSONATION: { ar: "انتحال صفة بنك — طلب OTP",          en: "Bank Impersonation — OTP Request" },
  ACCOUNT_UPDATE_PHISHING:        { ar: "تصيّد تحديث الحساب",                en: "Account Update Phishing" },
  FAKE_SHIPPING_PAYMENT:          { ar: "دفع رسوم شحنة وهمية",               en: "Fake Shipping Payment" },
  PRIZE_CARD_THEFT:               { ar: "سرقة بطاقة عبر جائزة وهمية",        en: "Prize-Bait Card Theft" },
  FAKE_GOVERNMENT_FINE:           { ar: "غرامة حكومية وهمية",                en: "Fake Government Fine" },
  FAKE_INVESTMENT:                { ar: "استثمار وهمي",                      en: "Fake Investment" },
  TAX_REFUND_PHISHING:            { ar: "تصيّد استرداد ضريبي",               en: "Tax Refund Phishing" },
  CARD_BLOCK_THREAT:              { ar: "تهديد بحظر البطاقة",                en: "Card Block Threat" },
  FAKE_TRANSFER_FEE:              { ar: "رسوم تحويل وهمية",                  en: "Fake Transfer Fee" },
  PASSWORD_RESET_PHISHING:        { ar: "تصيّد إعادة تعيين كلمة المرور",     en: "Password Reset Phishing" },
  FAKE_REMITTANCE_FEE:            { ar: "رسوم حوالة وهمية",                  en: "Fake Remittance Fee" },
  LOGIN_OTP_CANCEL:               { ar: "إلغاء تسجيل دخول — OTP مزيف",       en: "Login OTP Cancellation Fraud" },
  FAKE_MERCHANT_DISCOUNT:         { ar: "متجر وهمي بخصم مبالغ فيه",          en: "Fake Merchant Discount" },
  FOREIGN_PURCHASE_OTP:           { ar: "طلب OTP لعملية شراء خارجية",        en: "Foreign Purchase OTP Request" },
  UTILITY_BILL_PHISHING:          { ar: "تصيّد فاتورة خدمات",                en: "Utility Bill Phishing" },
  JOB_OFFER_FEE:                  { ar: "رسوم عرض عمل وهمي",                 en: "Fake Job Offer Fee" },
  ADDRESS_UPDATE_LINK:            { ar: "رابط تحديث العنوان الوطني",         en: "Address Update Link" },
  UNKNOWN_TRANSFER_LINK:          { ar: "رابط حوالة مجهول المصدر",           en: "Unknown Transfer Link" },
  LOW_RISK_BANK_REMINDER:         { ar: "تذكير بنكي منخفض الخطورة",          en: "Low-Risk Bank Reminder" },
  LOW_RISK_PURCHASE_ALERT:        { ar: "تنبيه شراء منخفض الخطورة",          en: "Low-Risk Purchase Alert" },
  CALL_CENTER_IMPERSONATION:      { ar: "انتحال مركز اتصال البنك",           en: "Call-Center Impersonation" },

  // --- Defensive: generic keys the AI engine / future detectors may emit ---
  CARD_DATA_THEFT_ATTEMPT:        { ar: "محاولة سرقة بيانات البطاقة",        en: "Card Data Theft Attempt" },
  INVESTMENT_FRAUD:               { ar: "احتيال استثماري",                   en: "Investment Fraud" },
  FAKE_STORE:                     { ar: "متجر وهمي",                         en: "Fake Store" },
  FAKE_LINK_PHISHING:             { ar: "رابط تصيّد وهمي",                    en: "Fake Link / Phishing" },
  OTP_FRAUD:                      { ar: "احتيال OTP",                        en: "OTP Fraud" },
  DELIVERY_FRAUD:                 { ar: "احتيال شحنة",                       en: "Delivery / Shipment Fraud" },
  ELECTRONIC_EXTORTION:           { ar: "ابتزاز إلكتروني",                   en: "Electronic Extortion" },
  BANK_IMPERSONATION:             { ar: "انتحال صفة بنك",                    en: "Bank Impersonation" },
  SOCIAL_ENGINEERING:             { ar: "هندسة اجتماعية",                    en: "Social Engineering" },
  SUSPICIOUS_PURCHASE:            { ar: "عملية شراء مشبوهة",                 en: "Suspicious Purchase" },
  BLOCKED_ONLINE_PURCHASE:        { ar: "شراء إلكتروني محظور",               en: "Blocked Online Purchase" },
  UNAUTHORIZED_PURCHASE:          { ar: "محاولة شراء غير مصرحة",             en: "Unauthorized Purchase Attempt" },
};

// Arabic pattern strings emitted at runtime. The rule detector
// (DashboardServiceImpl.detectFraudPattern), the transaction flow, and legacy
// data all store Arabic; the map lets English mode translate them.
const ARABIC_PATTERNS = {
  // DashboardServiceImpl.detectFraudPattern
  "احتيال OTP عبر الهندسة الاجتماعية": { ar: "احتيال OTP عبر الهندسة الاجتماعية", en: "OTP Social-Engineering Fraud" },
  "رابط شحنة أو توصيل وهمي":           { ar: "رابط شحنة أو توصيل وهمي",           en: "Fake Delivery / Shipping Link" },
  "استثمار احتيالي وأرباح وهمية":      { ar: "استثمار احتيالي وأرباح وهمية",      en: "Fraudulent Investment & Fake Returns" },
  "محاولة سرقة بيانات البطاقة":        { ar: "محاولة سرقة بيانات البطاقة",        en: "Card Data Theft Attempt" },
  "استخدام برنامج تحكم عن بعد":        { ar: "استخدام برنامج تحكم عن بعد",        en: "Remote-Access Software Use" },
  "رابط مالي مشبوه":                   { ar: "رابط مالي مشبوه",                   en: "Suspicious Financial Link" },
  "تحويل مالي مشتبه به":               { ar: "تحويل مالي مشتبه به",               en: "Suspicious Money Transfer" },
  "محاولة احتيال مالي مشتبه بها":      { ar: "محاولة احتيال مالي مشتبه بها",      en: "Suspected Financial Fraud" },
  // Transaction flow (PurchaseCheckout / TransactionAnalysisService)
  "عملية شراء مشبوهة":                 { ar: "عملية شراء مشبوهة",                 en: "Suspicious Purchase" },
  "شراء إلكتروني محظور":               { ar: "شراء إلكتروني محظور",               en: "Blocked Online Purchase" },
  "محاولة شراء غير مصرحة":             { ar: "محاولة شراء غير مصرحة",             en: "Unauthorized Purchase Attempt" },
  // Legacy Arabic values that may still exist on old cases
  "احتيال عبر الهندسة الاجتماعية":     { ar: "هندسة اجتماعية",                    en: "Social Engineering Fraud" },
  "رابط شحنة وهمي":                    { ar: "رابط شحنة وهمي",                    en: "Fake Delivery Link" },
};

// Pattern stored on cases created when a customer stops an intercepted
// purchase — also used as the freeze reason in that flow (App.jsx).
export const UNAUTHORIZED_PURCHASE_PATTERN_AR = "محاولة شراء غير مصرحة";

// Pattern the backend stores on auto-blocked purchase cases — used by
// App.jsx when injecting a freshly blocked case into the bank dashboard.
export const BLOCKED_PURCHASE_PATTERN_AR = "شراء إلكتروني محظور";

// Single source of truth: snake_case keys + runtime Arabic strings + the officer
// dropdown values, all resolving to a bilingual { ar, en } label.
export const FRAUD_PATTERN_MAP = {
  ...SNAKE_CASE_PATTERNS,
  ...ARABIC_PATTERNS,
  ...Object.fromEntries(FRAUD_PATTERNS.map((p) => [p.ar, { ar: p.ar, en: p.en }])),
};

export function displayFraudPattern(pattern, lang) {
  if (!pattern) return lang === "ar" ? "غير محدد" : "Unknown";

  const entry = FRAUD_PATTERN_MAP[pattern];
  if (entry) return lang === "ar" ? entry.ar : entry.en;

  // Last resort for an unmapped key: turn UPPER_SNAKE_CASE into "Title Case"
  // so the UI never shows a raw key. (Arabic strings have no ASCII word chars,
  // so they pass through unchanged — still readable.)
  return pattern
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

// Mirrors backend RiskLevel.fromScore so live UI (edit-mode gauge) matches
// what the server will classify.
export function riskLevelFromScore(score) {
  if (score >= 80) return "critical";
  if (score >= 60) return "high";
  if (score >= 30) return "medium";
  return "low";
}
