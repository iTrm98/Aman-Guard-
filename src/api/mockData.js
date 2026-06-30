// Mock responses shaped to match the Spring Boot backend contracts described
// in the MVP spec (BACK-SB-004 controllers: /analyze, /freeze, /cases/active).
// These are used as fallbacks while VITE_USE_MOCKS=true or when the backend
// is unreachable, so the frontend stays demo-ready end to end.

export const mockCallStatus = {
  hasActiveOfficialCall: false,
  message: "الرقم الذي يتصل بك حالياً لا ينتمي لأنظمة البنك. يرجى إنهاء المكالمة فوراً وعدم مشاركة أي رموز (OTP).",
};

export const mockAnalysisResult = {
  riskScore: 95,
  riskLevel: "critical",
  riskLabel: "حرج (Critical)",
  findings: [
    {
      title: "طلب رمز OTP",
      detail: "البنك لن يطلب منك رمز التحقق الخاص بك أبداً.",
    },
    {
      title: "صيغة استعجال وتهديد",
      detail: 'استخدام عبارة "إيقاف الحساب" لخلق شعور بالذعر.',
    },
    {
      title: "أسلوب الهندسة الاجتماعية",
      detail: "انتحال صفة رسمية لسرقة البيانات.",
    },
  ],
  recommendation: "لا تستجب للرسالة. قم بتجاهلها فوراً ولا تشارك أي بيانات مالية.",
  interruptionQuestions: [
    { id: "q1", text: "هل طلب منك شخص ما تنفيذ هذه العملية وهو معك على الهاتف؟" },
    { id: "q2", text: "هل هناك وعود بأرباح سريعة أو تهديد بإيقاف خدماتك؟" },
  ],
  caseId: null,
};

export const mockFreezeResponse = (reportNumber) => ({
  success: true,
  reportNumber,
  message: "تم تجميد حسابك احترازياً لحماية أموالك.",
});

export const mockStats = {
  criticalToday: 12,
  suspectedCases: 27,
  accountsFrozen: 8,
  amountSaved: "1,240,500",
};

export const mockCases = [
  {
    id: "FR-9021",
    timeAgo: "منذ 15 دقيقة",
    customerName: "تركي السفياني",
    fraudPattern: "رابط شحنة وهمي (مبلغ صغير)",
    riskScore: 82,
    riskLevel: "high",
    accountStatus: "active",
  },
  {
    id: "FR-9020",
    timeAgo: "منذ ساعتين",
    customerName: "محمد الزهراني",
    fraudPattern: "إضافة مستفيد جديد مريب (استثمار)",
    riskScore: 91,
    riskLevel: "critical",
    accountStatus: "partially_restricted",
  },
];
