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
                    "البنك لن يطلب منك مشاركة رمز التحقق أو رمز المصادقة."
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
                    "الرسالة تستخدم تهديد إيقاف الحساب للضغط على العميل."
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
                    "الاستعجال من الأساليب الشائعة المستخدمة في الاحتيال."
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
                    "المرسل يدعي أنه يمثل البنك أو جهة مالية رسمية."
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
                    "قد يكون طلب تحديث البيانات محاولة للحصول على معلومات العميل."
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
                    "يجب عدم مشاركة بيانات البطاقة أو الرقم السري مع أي شخص."
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
                    "الرسالة تتضمن وعوداً بأرباح سريعة أو مضمونة."
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
                    "قد تكون الرسالة محاولة لسرقة بيانات البطاقة."
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
                    "برنامج التحكم عن بعد قد يسمح للمحتال بالسيطرة على جهاز العميل."
            ));
        }

        if (URL_PATTERN.matcher(originalText).find()) {
            riskScore += 20;

            findings.add(new RiskFindingResponse(
                    "وجود رابط مشبوه",
                    "الرسالة تحتوي على رابط يجب التحقق منه قبل فتحه."
            ));
        }

        riskScore = Math.min(riskScore, MAX_RISK_SCORE);

        RiskLevel riskLevel = RiskLevel.fromScore(riskScore);

        if (findings.isEmpty()) {
            findings.add(new RiskFindingResponse(
                    "لا توجد مؤشرات قوية",
                    "لم يتم اكتشاف مؤشرات احتيال واضحة في النص المدخل."
            ));
        }

        String recommendation = createRecommendation(riskLevel);

        FraudCase fraudCase = new FraudCase(
                originalText,
                riskScore,
                riskLevel,
                recommendation
        );

        FraudCase savedCase = fraudCaseRepository.save(fraudCase);

        return new AnalyzeFraudResponse(
                riskScore,
                riskLevel.name().toLowerCase(Locale.ROOT),
                createRiskLabel(riskLevel),
                findings,
                recommendation,
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

    private String createRiskLabel(RiskLevel riskLevel) {
        return switch (riskLevel) {
            case LOW -> "منخفض (Low)";
            case MEDIUM -> "متوسط (Medium)";
            case HIGH -> "مرتفع (High)";
            case CRITICAL -> "حرج (Critical)";
        };
    }

    private String createRecommendation(RiskLevel riskLevel) {
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