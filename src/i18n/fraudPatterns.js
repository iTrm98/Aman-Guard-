// Shared fraud-pattern definitions. The backend stores and returns pattern
// strings in Arabic; English display is resolved client-side through the map
// below. Defined once here — never duplicate these lists in components.

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

// Patterns the backend's keyword engine (DashboardServiceImpl.detectFraudPattern)
// emits for auto-analyzed cases — these never appear in dropdowns but must
// still translate in the UI.
const BACKEND_DETECTED_PATTERNS = {
  "احتيال OTP عبر الهندسة الاجتماعية": "OTP Social-Engineering Fraud",
  "رابط شحنة أو توصيل وهمي":           "Fake Delivery Link",
  "استثمار احتيالي وأرباح وهمية":      "Fraudulent Investment",
  "محاولة سرقة بيانات البطاقة":        "Card Data Theft Attempt",
  "استخدام برنامج تحكم عن بعد":        "Remote-Access Software",
  "رابط مالي مشبوه":                   "Suspicious Financial Link",
  "تحويل مالي مشتبه به":               "Suspicious Transfer",
  "محاولة احتيال مالي مشتبه بها":      "Suspected Financial Fraud",
};

export const FRAUD_PATTERN_MAP = {
  ...Object.fromEntries(FRAUD_PATTERNS.map((p) => [p.ar, p.en])),
  ...BACKEND_DETECTED_PATTERNS,
};

export function displayFraudPattern(pattern, lang) {
  if (!pattern) return "";
  return lang === "en" ? (FRAUD_PATTERN_MAP[pattern] ?? pattern) : pattern;
}

// Mirrors backend RiskLevel.fromScore so live UI (edit-mode gauge) matches
// what the server will classify.
export function riskLevelFromScore(score) {
  if (score >= 80) return "critical";
  if (score >= 60) return "high";
  if (score >= 30) return "medium";
  return "low";
}
