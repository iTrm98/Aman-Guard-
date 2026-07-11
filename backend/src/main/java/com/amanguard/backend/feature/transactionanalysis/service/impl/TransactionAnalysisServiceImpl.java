package com.amanguard.backend.feature.transactionanalysis.service.impl;

import com.amanguard.backend.common.exception.BadRequestException;
import com.amanguard.backend.common.exception.ResourceNotFoundException;
import com.amanguard.backend.feature.emergencyfreeze.dto.response.FreezeAccountResponse;
import com.amanguard.backend.feature.emergencyfreeze.service.EmergencyFreezeService;
import com.amanguard.backend.feature.fraudanalysis.model.FraudCase;
import com.amanguard.backend.feature.fraudanalysis.model.RiskLevel;
import com.amanguard.backend.feature.fraudanalysis.repository.FraudCaseRepository;
import com.amanguard.backend.feature.notifications.model.Notification;
import com.amanguard.backend.feature.notifications.repository.NotificationRepository;
import com.amanguard.backend.feature.transactionanalysis.dto.request.AnalyzeTransactionRequest;
import com.amanguard.backend.feature.transactionanalysis.dto.response.AnalyzeTransactionResponse;
import com.amanguard.backend.feature.transactionanalysis.dto.response.TransactionDecisionResponse;
import com.amanguard.backend.feature.transactionanalysis.dto.response.TransactionRiskFindingResponse;
import com.amanguard.backend.feature.transactionanalysis.model.TransactionAnalysis;
import com.amanguard.backend.feature.transactionanalysis.repository.TransactionAnalysisRepository;
import com.amanguard.backend.feature.transactionanalysis.service.TransactionAnalysisService;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;
import java.util.Set;

@Service
public class TransactionAnalysisServiceImpl
        implements TransactionAnalysisService {

    private static final String BLOCKED_PURCHASE_PATTERN =
            "شراء إلكتروني محظور";

    private static final String UNAUTHORIZED_PURCHASE_PATTERN =
            "محاولة شراء غير مصرحة";

    // TODO: replace with real AI engine — URL keyword heuristics common in
    // phishing / fraudulent merchant sites. Loaded from fraud_keywords.json.
    private final List<String> suspiciousUrlKeywords;

    // TODO: replace with real AI engine — whitelist standing in for an
    // approved-merchants database (English + normalized Arabic aliases).
    // Loaded from merchants.json.
    private final Set<String> knownMerchants;

    // Hard purchase limit — backend configuration only
    // (amanguard.fraud.max-purchase-amount). Never exposed as a customer
    // form field; bank officers see it read-only via GET /api/config/thresholds.
    @Value("${amanguard.fraud.max-purchase-amount:5000}")
    private BigDecimal maxPurchaseAmount;

    private final TransactionAnalysisRepository transactionAnalysisRepository;
    private final FraudCaseRepository fraudCaseRepository;
    private final NotificationRepository notificationRepository;
    private final EmergencyFreezeService emergencyFreezeService;

    public TransactionAnalysisServiceImpl(
            TransactionAnalysisRepository transactionAnalysisRepository,
            FraudCaseRepository fraudCaseRepository,
            NotificationRepository notificationRepository,
            EmergencyFreezeService emergencyFreezeService,
            ObjectMapper objectMapper
    ) {
        this.transactionAnalysisRepository =
                transactionAnalysisRepository;

        this.fraudCaseRepository =
                fraudCaseRepository;

        this.notificationRepository =
                notificationRepository;

        this.emergencyFreezeService =
                emergencyFreezeService;

        this.suspiciousUrlKeywords = List.copyOf(
                readStringList(objectMapper, "fraud_keywords.json")
        );

        this.knownMerchants = Set.copyOf(
                readStringList(objectMapper, "merchants.json")
        );
    }

    private static List<String> readStringList(
            ObjectMapper objectMapper,
            String resourceName
    ) {
        try {
            return objectMapper.readValue(
                    new ClassPathResource(resourceName).getInputStream(),
                    new TypeReference<List<String>>() {
                    }
            );
        } catch (IOException e) {
            throw new IllegalStateException(
                    "Failed to load " + resourceName + " from classpath",
                    e
            );
        }
    }

    // Outcome of the mock rule evaluation, before persistence.
    private record RuleOutcome(
            int riskScore,
            RiskLevel riskLevel,
            String riskLabelAr,
            String riskLabelEn,
            String action,
            List<TransactionRiskFindingResponse> findings,
            String recommendationAr,
            String recommendationEn
    ) {
    }

    @Override
    @Transactional
    public AnalyzeTransactionResponse analyze(
            AnalyzeTransactionRequest request
    ) {
        RuleOutcome outcome = evaluateRules(request);

        TransactionAnalysis transactionAnalysis =
                new TransactionAnalysis(
                        request.merchantName().trim(),
                        request.amount(),
                        request.currency(),
                        trimToNull(request.merchantUrl()),
                        trimToNull(request.transactionType()),
                        outcome.riskScore(),
                        outcome.riskLevel(),
                        outcome.action()
                );

        String reportNumber = null;

        if ("blocked".equals(outcome.action())) {
            FraudCase savedCase = createBlockedPurchaseCase(
                    request,
                    outcome
            );

            reportNumber = resolveReportNumber(
                    savedCase,
                    outcome.riskLevel()
            );

            transactionAnalysis.attachFraudCase(
                    savedCase.getId(),
                    reportNumber
            );

            notifySoc(
                    savedCase,
                    request,
                    outcome.riskLevel(),
                    reportNumber
            );
        }

        TransactionAnalysis savedAnalysis =
                transactionAnalysisRepository.save(
                        transactionAnalysis
                );

        return new AnalyzeTransactionResponse(
                savedAnalysis.getId(),
                outcome.riskScore(),
                outcome.riskLevel().name().toLowerCase(Locale.ROOT),
                outcome.riskLabelAr(),
                outcome.riskLabelEn(),
                outcome.action(),
                outcome.findings(),
                outcome.recommendationAr(),
                outcome.recommendationEn(),
                reportNumber
        );
    }

    // TODO: replace with real AI engine — mock analysis: four sequential
    // rules, first match wins.
    //   1. amount > configured max        -> critical, block + freeze
    //   2. suspicious URL keywords        -> high, block
    //   3. merchant not in known list     -> medium, suspend for customer
    //   4. otherwise                      -> low, allow
    private RuleOutcome evaluateRules(
            AnalyzeTransactionRequest request
    ) {
        // Rule 1: amount exceeds the configured maximum -> CRITICAL,
        // blocked and the account frozen immediately, no customer input.
        if (request.amount().compareTo(maxPurchaseAmount) > 0) {
            return new RuleOutcome(
                    95,
                    RiskLevel.CRITICAL,
                    "حرج — تجاوز الحد الأقصى المسموح به",
                    "Critical — Exceeds Maximum Allowed Amount",
                    "blocked",
                    List.of(new TransactionRiskFindingResponse(
                            "تجاوز الحد الأقصى للشراء",
                            "Transaction Exceeds Purchase Limit",
                            "المبلغ " + request.amount()
                                    + " ر.س يتجاوز الحد الأقصى المسموح به "
                                    + maxPurchaseAmount + " ر.س",
                            "Amount " + request.amount()
                                    + " SAR exceeds the maximum allowed limit of "
                                    + maxPurchaseAmount + " SAR"
                    )),
                    "تم حظر العملية تلقائياً وتجميد الحساب لحماية أموالك.",
                    "Transaction was automatically blocked and account frozen to protect your funds."
            );
        }

        // Rule 2: suspicious URL keywords -> HIGH, blocked automatically.
        if (hasSuspiciousUrl(request.merchantUrl())) {
            return new RuleOutcome(
                    82,
                    RiskLevel.HIGH,
                    "عالٍ — رابط مشبوه",
                    "High — Suspicious URL",
                    "blocked",
                    List.of(new TransactionRiskFindingResponse(
                            "رابط موقع مشبوه",
                            "Suspicious Website URL",
                            "يحتوي الرابط على أنماط مرتبطة بمواقع احتيالية معروفة",
                            "The URL contains patterns associated with known phishing sites"
                    )),
                    "تم حظر العملية. لا تشارك بياناتك مع هذا الموقع.",
                    "Transaction blocked. Do not share your data with this site."
            );
        }

        // Rule 3: unknown merchant -> MEDIUM, suspended for customer
        // confirmation via the interception overlay.
        if (!isKnownMerchant(request.merchantName())) {
            return new RuleOutcome(
                    55,
                    RiskLevel.MEDIUM,
                    "متوسط — تاجر غير معروف",
                    "Medium — Unknown Merchant",
                    "suspended",
                    List.of(new TransactionRiskFindingResponse(
                            "تاجر غير مسجل",
                            "Unregistered Merchant",
                            "لم يتم التحقق من هوية هذا المتجر في قاعدة بيانات التجار المعتمدين",
                            "This merchant has not been verified in the approved merchants database"
                    )),
                    "يرجى التأكد من أنك تعرف هذا المتجر قبل المتابعة.",
                    "Please make sure you recognize this merchant before proceeding."
            );
        }

        // Rule 4: everything else -> LOW, allowed.
        return new RuleOutcome(
                15,
                RiskLevel.LOW,
                "منخفض — العملية آمنة",
                "Low — Transaction Safe",
                "allowed",
                List.of(),
                "تم التحقق من العملية ولم يُرصد أي نشاط مريب.",
                "Transaction verified, no suspicious activity detected."
        );
    }

    @Override
    @Transactional
    public TransactionDecisionResponse confirm(
            Long transactionId
    ) {
        TransactionAnalysis transaction =
                findTransaction(transactionId);

        validateSuspended(transaction);

        transaction.confirmByCustomer();
        transactionAnalysisRepository.save(transaction);

        return new TransactionDecisionResponse(
                true,
                "تمت العملية بناءً على تأكيد العميل",
                null
        );
    }

    @Override
    @Transactional
    public TransactionDecisionResponse cancel(
            Long transactionId
    ) {
        TransactionAnalysis transaction =
                findTransaction(transactionId);

        validateSuspended(transaction);

        FraudCase fraudCase = new FraudCase(
                createCaseSummary(
                        transaction.getMerchantName(),
                        transaction.getAmount(),
                        transaction.getMerchantUrl(),
                        "أوقف العميل العملية بعد الاعتراض الأمني."
                ),
                transaction.getRiskScore(),
                transaction.getRiskLevel(),
                "تواصل مع العميل للتحقق من محاولة الشراء غير المصرحة."
        );

        fraudCase.setFraudPattern(UNAUTHORIZED_PURCHASE_PATTERN);
        fraudCase.setEstimatedAmount(transaction.getAmount());

        FraudCase savedCase = fraudCaseRepository.save(fraudCase);

        transaction.attachFraudCase(
                savedCase.getId(),
                createCaseNumber(savedCase.getId())
        );

        transaction.cancelByCustomer();
        transactionAnalysisRepository.save(transaction);

        notificationRepository.save(new Notification(
                "🚨",
                "محاولة شراء غير مصرحة",
                "Unauthorized Purchase Attempt",
                "أوقف العميل عملية شراء معلقة لدى \""
                        + transaction.getMerchantName()
                        + "\" بقيمة "
                        + transaction.getAmount()
                        + " ر.س — رقم الحالة "
                        + createCaseNumber(savedCase.getId()),
                "Customer stopped a suspended purchase at \""
                        + transaction.getMerchantName()
                        + "\" for SAR "
                        + transaction.getAmount()
                        + " — case "
                        + createCaseNumber(savedCase.getId()),
                false,
                "warning",
                savedCase.getId(),
                LocalDateTime.now()
        ));

        return new TransactionDecisionResponse(
                true,
                "تم إلغاء العملية",
                savedCase.getId()
        );
    }

    private FraudCase createBlockedPurchaseCase(
            AnalyzeTransactionRequest request,
            RuleOutcome outcome
    ) {
        FraudCase fraudCase = new FraudCase(
                createCaseSummary(
                        request.merchantName().trim(),
                        request.amount(),
                        request.merchantUrl(),
                        "تم حظر العملية تلقائياً بواسطة نظام الحماية."
                ),
                outcome.riskScore(),
                outcome.riskLevel(),
                outcome.recommendationAr()
        );

        fraudCase.setFraudPattern(BLOCKED_PURCHASE_PATTERN);
        fraudCase.setEstimatedAmount(request.amount());

        return fraudCaseRepository.save(fraudCase);
    }

    // Critical purchases freeze the account immediately (staff-authority
    // freeze: request + approve in one action, like manual SOC cases), and
    // the freeze report number becomes the customer-facing report number.
    private String resolveReportNumber(
            FraudCase savedCase,
            RiskLevel riskLevel
    ) {
        if (riskLevel != RiskLevel.CRITICAL) {
            return createCaseNumber(savedCase.getId());
        }

        FreezeAccountResponse freezeResponse =
                emergencyFreezeService.requestFreeze(
                        savedCase.getId(),
                        "blocked_purchase_auto"
                );

        emergencyFreezeService.approveRequest(
                freezeResponse.requestId()
        );

        return freezeResponse.reportNumber();
    }

    private void notifySoc(
            FraudCase savedCase,
            AnalyzeTransactionRequest request,
            RiskLevel riskLevel,
            String reportNumber
    ) {
        boolean frozen = riskLevel == RiskLevel.CRITICAL;

        notificationRepository.save(new Notification(
                frozen ? "❄️" : "🚫",
                "شراء إلكتروني محظور",
                "Blocked Online Purchase",
                "تم حظر عملية شراء لدى \""
                        + request.merchantName().trim()
                        + "\" بقيمة "
                        + request.amount()
                        + " ر.س تلقائياً"
                        + (frozen ? " وتجميد الحساب احترازياً" : "")
                        + " — رقم البلاغ "
                        + reportNumber,
                "A purchase at \""
                        + request.merchantName().trim()
                        + "\" for SAR "
                        + request.amount()
                        + " was blocked automatically"
                        + (frozen ? " and the account was preventively frozen" : "")
                        + " — report "
                        + reportNumber,
                false,
                frozen ? "freeze" : "warning",
                savedCase.getId(),
                LocalDateTime.now()
        ));
    }

    private TransactionAnalysis findTransaction(
            Long transactionId
    ) {
        return transactionAnalysisRepository
                .findById(transactionId)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "العملية غير موجودة: " + transactionId
                        )
                );
    }

    // Only suspended transactions accept a customer decision — blocked
    // transactions have zero override ability, allowed ones need none.
    private void validateSuspended(
            TransactionAnalysis transaction
    ) {
        if (!"suspended".equals(transaction.getAction())) {
            throw new BadRequestException(
                    "هذه العملية غير قابلة للتأكيد أو الإلغاء من قبل العميل"
            );
        }

        if (transaction.getResolution() != null) {
            throw new BadRequestException(
                    "تم اتخاذ قرار بشأن هذه العملية مسبقًا"
            );
        }
    }

    // TODO: replace with real AI engine
    private boolean hasSuspiciousUrl(String merchantUrl) {
        if (merchantUrl == null || merchantUrl.isBlank()) {
            return false;
        }

        String url = merchantUrl
                .toLowerCase(Locale.ROOT)
                .trim();

        return suspiciousUrlKeywords.stream()
                .anyMatch(url::contains);
    }

    // TODO: replace with real AI engine
    private boolean isKnownMerchant(String merchantName) {
        String normalized = normalize(merchantName);

        return knownMerchants.stream()
                .anyMatch(normalized::contains);
    }

    private String createCaseSummary(
            String merchantName,
            BigDecimal amount,
            String merchantUrl,
            String outcome
    ) {
        return "عملية شراء إلكتروني لدى \""
                + merchantName
                + "\" بقيمة "
                + amount
                + " ر.س"
                + (merchantUrl == null || merchantUrl.isBlank()
                        ? ""
                        : " عبر الرابط " + merchantUrl.trim())
                + ". "
                + outcome;
    }

    // Mirrors DashboardServiceImpl.createCaseNumber so the SOC table and the
    // customer-facing report number agree for non-frozen blocked cases.
    private String createCaseNumber(Long caseId) {
        return "FR-" + (9000 + caseId);
    }

    private String trimToNull(String value) {
        if (value == null) {
            return null;
        }

        String trimmed = value.trim();

        return trimmed.isEmpty() ? null : trimmed;
    }

    private String normalize(String text) {
        if (text == null) {
            return "";
        }

        return text
                .toLowerCase(Locale.ROOT)
                .replaceAll(
                        "[\\u064B-\\u065F\\u0670]",
                        ""
                )
                .replace('أ', 'ا')
                .replace('إ', 'ا')
                .replace('آ', 'ا')
                .replace('ة', 'ه')
                .replace('ى', 'ي')
                .trim();
    }
}
