package com.amanguard.backend.feature.fraudanalysis.service.impl;

import com.amanguard.backend.feature.fraudanalysis.dto.response.AnalyzeFraudResponse;
import com.amanguard.backend.feature.fraudanalysis.dto.response.InterruptionQuestionResponse;
import com.amanguard.backend.feature.fraudanalysis.dto.response.RiskFindingResponse;
import com.amanguard.backend.feature.fraudanalysis.model.FraudCase;
import com.amanguard.backend.feature.fraudanalysis.model.RiskLevel;
import com.amanguard.backend.feature.fraudanalysis.repository.FraudCaseRepository;
import com.amanguard.backend.feature.fraudanalysis.service.FraudAnalysisService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Locale;
import java.util.regex.Pattern;

@Service
public class FraudAnalysisServiceImpl implements FraudAnalysisService {

    private static final int MAX_RISK_SCORE = 100;

    private static final Pattern URL_PATTERN = Pattern.compile(
            "(https?://|www\\.|bit\\.ly|tinyurl\\.com|t\\.co)",
            Pattern.CASE_INSENSITIVE
    );

    private final FraudCaseRepository fraudCaseRepository;

    public FraudAnalysisServiceImpl(
            FraudCaseRepository fraudCaseRepository
    ) {
        this.fraudCaseRepository = fraudCaseRepository;
    }

    @Override
    @Transactional
    public AnalyzeFraudResponse analyze(String originalText) {
        String normalizedText = normalize(originalText);

        int riskScore = 0;
        List<RiskFindingResponse> findings = new ArrayList<>();

        if (containsAny(
                normalizedText,
                "otp",
                "رمز التحقق",
                "كود التحقق",
                "الرمز المرسل"
        )) {
            riskScore += 35;

            findings.add(new RiskFindingResponse(
                    "طلب رمز OTP",
                    "OTP Code Request",
                    "البنك لن يطلب منك مشاركة رمز التحقق أو رمز المصادقة.",
                    "The bank will never ask you to share your OTP or authentication code."
            ));
        }

        if (containsAny(
                normalizedText,
                "ايقاف حسابك",
                "تعليق حسابك",
                "حظر حسابك",
                "اغلاق حسابك",
                "سيتم ايقاف الحساب"
        )) {
            riskScore += 20;

            findings.add(new RiskFindingResponse(
                    "استخدام التهديد",
                    "Threatening Language",
                    "الرسالة تستخدم تهديد إيقاف الحساب للضغط على العميل.",
                    "The message uses account-suspension threats to pressure the customer."
            ));
        }

        if (containsAny(
                normalizedText,
                "حول الان",
                "ادفع الان",
                "فورا",
                "بشكل عاجل",
                "حالا"
        )) {
            riskScore += 20;

            findings.add(new RiskFindingResponse(
                    "طلب عاجل لتنفيذ العملية",
                    "Urgent Action Demand",
                    "الاستعجال من الأساليب الشائعة المستخدمة في الاحتيال.",
                    "Urgency is a common tactic used in fraud."
            ));
        }

        if (containsAny(
                normalizedText,
                "موظف البنك",
                "خدمه العملاء",
                "قسم الحمايه",
                "قسم الامن",
                "البنك المركزي"
        )) {
            riskScore += 10;

            findings.add(new RiskFindingResponse(
                    "ادعاء صفة رسمية",
                    "Official Impersonation",
                    "المرسل يدعي أنه يمثل البنك أو جهة مالية رسمية.",
                    "The sender claims to represent the bank or an official financial authority."
            ));
        }

        if (containsAny(
                normalizedText,
                "تحديث البيانات",
                "حدث بياناتك",
                "تاكيد بياناتك",
                "تفعيل الحساب"
        )) {
            riskScore += 10;

            findings.add(new RiskFindingResponse(
                    "طلب تحديث البيانات",
                    "Data Update Request",
                    "قد يكون طلب تحديث البيانات محاولة للحصول على معلومات العميل.",
                    "A data-update request may be an attempt to harvest customer information."
            ));
        }

        if (containsAny(
                normalizedText,
                "رقم البطاقه",
                "بيانات البطاقه",
                "الرقم السري",
                "cvv",
                "تاريخ انتهاء البطاقه"
        )) {
            riskScore += 35;

            findings.add(new RiskFindingResponse(
                    "طلب بيانات مالية سرية",
                    "Confidential Financial Data Request",
                    "يجب عدم مشاركة بيانات البطاقة أو الرقم السري مع أي شخص.",
                    "Never share your card details or PIN with anyone."
            ));
        }

        if (containsAny(
                normalizedText,
                "ارباح مضمونه",
                "استثمار مضمون",
                "ضاعف اموالك",
                "ربح سريع",
                "فرصه استثماريه"
        )) {
            riskScore += 25;

            findings.add(new RiskFindingResponse(
                    "وعود مالية غير واقعية",
                    "Unrealistic Financial Promises",
                    "الرسالة تتضمن وعوداً بأرباح سريعة أو مضمونة.",
                    "The message promises quick or guaranteed profits."
            ));
        }

        if (containsAny(
                normalizedText,
                "شحنه",
                "توصيل",
                "طرد",
                "رسوم التوصيل"
        )) {
            riskScore += 15;

            findings.add(new RiskFindingResponse(
                    "احتمال رابط توصيل وهمي",
                    "Possible Fake Delivery Link",
                    "قد تكون الرسالة محاولة لسرقة بيانات البطاقة.",
                    "The message may be an attempt to steal card details."
            ));
        }

        if (containsAny(
                normalizedText,
                "anydesk",
                "teamviewer",
                "تحكم عن بعد",
                "ثبت التطبيق",
                "حمل البرنامج"
        )) {
            riskScore += 40;

            findings.add(new RiskFindingResponse(
                    "طلب تثبيت برنامج تحكم",
                    "Remote-Access Software Request",
                    "برنامج التحكم عن بعد قد يسمح للمحتال بالسيطرة على جهاز العميل.",
                    "Remote-access software can give the fraudster control of the customer's device."
            ));
        }

        if (URL_PATTERN.matcher(originalText).find()) {
            riskScore += 20;

            findings.add(new RiskFindingResponse(
                    "وجود رابط مشبوه",
                    "Suspicious Link Detected",
                    "الرسالة تحتوي على رابط يجب التحقق منه قبل فتحه.",
                    "The message contains a link that must be verified before opening."
            ));
        }

        riskScore = Math.min(riskScore, MAX_RISK_SCORE);

        RiskLevel riskLevel = RiskLevel.fromScore(riskScore);

        if (findings.isEmpty()) {
            findings.add(new RiskFindingResponse(
                    "لا توجد مؤشرات قوية",
                    "No Strong Indicators",
                    "لم يتم اكتشاف مؤشرات احتيال واضحة في النص المدخل.",
                    "No clear fraud indicators were detected in the submitted text."
            ));
        }

        String recommendationAr = createRecommendationAr(riskLevel);

        FraudCase fraudCase = new FraudCase(
                originalText,
                riskScore,
                riskLevel,
                recommendationAr
        );

        FraudCase savedCase = fraudCaseRepository.save(fraudCase);

        return new AnalyzeFraudResponse(
                riskScore,
                riskLevel.name().toLowerCase(Locale.ROOT),
                createRiskLabelAr(riskLevel),
                createRiskLabelEn(riskLevel),
                findings,
                recommendationAr,
                createRecommendationEn(riskLevel),
                createQuestions(riskLevel),
                savedCase.getId()
        );
    }

    private boolean containsAny(
            String normalizedText,
            String... keywords
    ) {
        return Arrays.stream(keywords)
                .map(this::normalize)
                .anyMatch(normalizedText::contains);
    }

    private String normalize(String text) {
        if (text == null) {
            return "";
        }

        return text
                .toLowerCase(Locale.ROOT)
                .replaceAll("[\\u064B-\\u065F\\u0670]", "")
                .replace('أ', 'ا')
                .replace('إ', 'ا')
                .replace('آ', 'ا')
                .replace('ة', 'ه')
                .replace('ى', 'ي')
                .trim();
    }

    private String createRiskLabelAr(RiskLevel riskLevel) {
        return switch (riskLevel) {
            case LOW -> "منخفض";
            case MEDIUM -> "متوسط";
            case HIGH -> "مرتفع";
            case CRITICAL -> "حرج";
        };
    }

    private String createRiskLabelEn(RiskLevel riskLevel) {
        return switch (riskLevel) {
            case LOW -> "Low";
            case MEDIUM -> "Medium";
            case HIGH -> "High";
            case CRITICAL -> "Critical";
        };
    }

    private String createRecommendationAr(RiskLevel riskLevel) {
        return switch (riskLevel) {
            case LOW ->
                    "لم يتم اكتشاف خطر مرتفع، لكن تحقق دائماً من هوية المرسل.";

            case MEDIUM ->
                    "تحقق من المرسل والرابط قبل تنفيذ أي عملية مالية.";

            case HIGH ->
                    "لا تنفذ العملية قبل التواصل مع البنك من خلال قنواته الرسمية.";

            case CRITICAL ->
                    "أوقف العملية فوراً، ولا تشارك رمز التحقق أو بيانات البطاقة.";
        };
    }

    private String createRecommendationEn(RiskLevel riskLevel) {
        return switch (riskLevel) {
            case LOW ->
                    "No high risk detected, but always verify the sender's identity.";

            case MEDIUM ->
                    "Verify the sender and the link before making any financial transaction.";

            case HIGH ->
                    "Do not proceed before contacting the bank through its official channels.";

            case CRITICAL ->
                    "Stop immediately — do not share your OTP or card details.";
        };
    }

    private List<InterruptionQuestionResponse> createQuestions(
            RiskLevel riskLevel
    ) {
        if (riskLevel == RiskLevel.LOW ||
                riskLevel == RiskLevel.MEDIUM) {
            return List.of();
        }

        return List.of(
                new InterruptionQuestionResponse(
                        "q1",
                        "هل طلب منك شخص تنفيذ هذه العملية وهو معك على الهاتف؟"
                ),
                new InterruptionQuestionResponse(
                        "q2",
                        "هل طلب منك مشاركة رمز OTP أو بيانات البطاقة؟"
                ),
                new InterruptionQuestionResponse(
                        "q3",
                        "هل هددك بإيقاف الحساب أو طلب منك التصرف فوراً؟"
                )
        );
    }
}
