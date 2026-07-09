package com.amanguard.backend.feature.dashboard.service.impl;

import com.amanguard.backend.common.exception.ResourceNotFoundException;
import com.amanguard.backend.feature.dashboard.dto.request.CreateCaseRequest;
import com.amanguard.backend.feature.dashboard.dto.request.UpdateCaseRequest;
import com.amanguard.backend.feature.dashboard.dto.response.ActiveCaseResponse;
import com.amanguard.backend.feature.dashboard.dto.response.DashboardResponse;
import com.amanguard.backend.feature.dashboard.dto.response.DashboardStatsResponse;
import com.amanguard.backend.feature.dashboard.dto.response.PaginationResponse;
import com.amanguard.backend.feature.dashboard.service.DashboardService;
import com.amanguard.backend.feature.emergencyfreeze.dto.response.FreezeAccountResponse;
import com.amanguard.backend.feature.emergencyfreeze.model.FreezeRequest;
import com.amanguard.backend.feature.emergencyfreeze.model.FreezeStatus;
import com.amanguard.backend.feature.emergencyfreeze.repository.FreezeRequestRepository;
import com.amanguard.backend.feature.emergencyfreeze.service.EmergencyFreezeService;
import com.amanguard.backend.feature.fraudanalysis.model.FraudCase;
import com.amanguard.backend.feature.fraudanalysis.model.RiskLevel;
import com.amanguard.backend.feature.fraudanalysis.repository.FraudCaseRepository;
import com.amanguard.backend.feature.notifications.model.Notification;
import com.amanguard.backend.feature.notifications.repository.NotificationRepository;
import com.amanguard.backend.feature.realtime.dto.CaseRealtimeMessage;
import com.amanguard.backend.feature.realtime.dto.NotificationRealtimeMessage;
import com.amanguard.backend.feature.realtime.service.RealtimePublishService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.text.NumberFormat;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;
import java.util.Optional;

@Service
public class DashboardServiceImpl
        implements DashboardService {

    private static final String MANUAL_CASE_INPUT_TEXT =
            "حالة مدخلة يدوياً بواسطة موظف البنك.";

    private static final String MANUAL_CASE_RECOMMENDATION =
            "تمت إضافة الحالة يدوياً وهي بانتظار مراجعة فريق مكافحة الاحتيال.";

    private final FraudCaseRepository fraudCaseRepository;
    private final FreezeRequestRepository freezeRequestRepository;
    private final NotificationRepository notificationRepository;
    private final EmergencyFreezeService emergencyFreezeService;
    private final RealtimePublishService realtimePublishService;

    public DashboardServiceImpl(
            FraudCaseRepository fraudCaseRepository,
            FreezeRequestRepository freezeRequestRepository,
            NotificationRepository notificationRepository,
            EmergencyFreezeService emergencyFreezeService,
            RealtimePublishService realtimePublishService
    ) {
        this.fraudCaseRepository = fraudCaseRepository;
        this.freezeRequestRepository = freezeRequestRepository;
        this.notificationRepository = notificationRepository;
        this.emergencyFreezeService = emergencyFreezeService;
        this.realtimePublishService = realtimePublishService;
    }

    @Override
    public DashboardResponse getActiveCases(
            int page,
            int size
    ) {
        int safePage = Math.max(page, 0);
        int safeSize = normalizePageSize(size);

        Sort sort = Sort.by(
                Sort.Direction.DESC,
                "createdAt"
        );

        Page<FraudCase> fraudCasePage =
                fraudCaseRepository.findAll(
                        PageRequest.of(
                                safePage,
                                safeSize,
                                sort
                        )
                );

        List<FraudCase> allFraudCases =
                fraudCaseRepository.findAll(sort);

        List<ActiveCaseResponse> allCaseResponses =
                allFraudCases
                        .stream()
                        .map(this::createCaseResponse)
                        .toList();

        DashboardStatsResponse stats =
                createStats(
                        allFraudCases,
                        allCaseResponses
                );

        List<ActiveCaseResponse> cases =
                fraudCasePage
                        .getContent()
                        .stream()
                        .map(this::createCaseResponse)
                        .toList();

        return new DashboardResponse(
                stats,
                cases,
                PaginationResponse.from(fraudCasePage)
        );
    }

    @Override
    public ActiveCaseResponse getCaseById(Long caseId) {
        return createCaseResponse(findFraudCase(caseId));
    }

    @Override
    @Transactional
    public ActiveCaseResponse createCase(CreateCaseRequest request) {
        String description = request.description() == null
                ? ""
                : request.description().trim();

        FraudCase fraudCase = new FraudCase(
                description.isEmpty()
                        ? MANUAL_CASE_INPUT_TEXT
                        : description,
                request.riskScore(),
                RiskLevel.fromScore(request.riskScore()),
                MANUAL_CASE_RECOMMENDATION
        );

        fraudCase.setCustomerName(request.customerName().trim());
        fraudCase.setFraudPattern(request.fraudPattern().trim());
        fraudCase.setAccountNumber(trimToNull(request.accountNumber()));
        fraudCase.setPhone(trimToNull(request.phone()));

        String notes = description.isEmpty() ? null : description;

        if ("close".equals(request.immediateAction())) {
            String closeNote =
                    "الإجراء الفوري المختار: إغلاق فوري.";

            notes = notes == null
                    ? closeNote
                    : notes + "\n" + closeNote;
        }

        fraudCase.setNotes(notes);

        FraudCase savedCase =
                fraudCaseRepository.save(fraudCase);

        boolean freezeAction =
                "freeze".equals(request.immediateAction())
                        || "close".equals(request.immediateAction());

        if (freezeAction) {
            FreezeAccountResponse freezeResponse =
                    emergencyFreezeService.requestFreeze(
                            savedCase.getId(),
                            "manual_case_" + request.immediateAction()
                    );

            emergencyFreezeService.approveRequest(
                    freezeResponse.requestId()
            );
        }

        ActiveCaseResponse response =
                createCaseResponse(savedCase);

        Notification notification =
                notificationRepository.save(
                        new Notification(
                                freezeAction ? "❄️" : "🚨",
                                freezeAction ? "تجميد حساب" : "حالة جديدة",
                                freezeAction ? "Account Freeze" : "New Case",
                                "تم إنشاء حالة يدوياً للعميل "
                                        + savedCase.getCustomerName()
                                        + " — رقم الحالة " + response.id(),
                                "Manual case created for customer "
                                        + savedCase.getCustomerName()
                                        + " — case " + response.id(),
                                false,
                                freezeAction ? "freeze" : "warning",
                                savedCase.getId(),
                                LocalDateTime.now()
                        )
                );

        publishCaseEvent(
                savedCase,
                response,
                "NEW_CASE"
        );

        publishNotificationEvent(
                notification,
                "NEW_NOTIFICATION"
        );

        return response;
    }

    @Override
    @Transactional
    public ActiveCaseResponse updateCase(
            Long caseId,
            UpdateCaseRequest request
    ) {
        FraudCase fraudCase = findFraudCase(caseId);

        if (hasText(request.customerName())) {
            fraudCase.setCustomerName(
                    request.customerName().trim()
            );
        }

        if (hasText(request.fraudPattern())) {
            fraudCase.setFraudPattern(
                    request.fraudPattern().trim()
            );
        }

        if (request.riskScore() != null) {
            fraudCase.updateRiskAssessment(
                    request.riskScore(),
                    RiskLevel.fromScore(request.riskScore()),
                    fraudCase.getRecommendation()
            );
        }

        if (hasText(request.accountStatus())) {
            fraudCase.setAccountStatusOverride(
                    request.accountStatus()
            );
        }

        if (request.notes() != null) {
            fraudCase.setNotes(
                    trimToNull(request.notes())
            );
        }

        FraudCase savedCase =
                fraudCaseRepository.save(fraudCase);

        ActiveCaseResponse response =
                createCaseResponse(savedCase);

        publishCaseEvent(
                savedCase,
                response,
                "UPDATED_CASE"
        );

        return response;
    }

    private FraudCase findFraudCase(Long caseId) {
        return fraudCaseRepository
                .findById(caseId)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "حالة الاحتيال غير موجودة: " + caseId
                        )
                );
    }

    private DashboardStatsResponse createStats(
            List<FraudCase> fraudCases,
            List<ActiveCaseResponse> caseResponses
    ) {
        LocalDateTime todayStart =
                LocalDate.now().atStartOfDay();

        LocalDateTime yesterdayStart =
                todayStart.minusDays(1);

        List<RiskLevel> criticalLevels =
                List.of(
                        RiskLevel.CRITICAL,
                        RiskLevel.HIGH
                );

        long criticalToday =
                fraudCaseRepository
                        .countByRiskLevelInAndCreatedAtGreaterThanEqual(
                                criticalLevels,
                                todayStart
                        );

        long criticalYesterday =
                fraudCaseRepository
                        .countByRiskLevelInAndCreatedAtGreaterThanEqualAndCreatedAtLessThan(
                                criticalLevels,
                                yesterdayStart,
                                todayStart
                        );

        long suspectedToday =
                fraudCaseRepository
                        .countByRiskLevelInAndCreatedAtGreaterThanEqual(
                                List.of(RiskLevel.MEDIUM),
                                todayStart
                        );

        long suspectedYesterday =
                fraudCaseRepository
                        .countByRiskLevelInAndCreatedAtGreaterThanEqualAndCreatedAtLessThan(
                                List.of(RiskLevel.MEDIUM),
                                yesterdayStart,
                                todayStart
                        );

        long approvalsToday =
                freezeRequestRepository
                        .countByStatusAndUpdatedAtGreaterThanEqual(
                                FreezeStatus.APPROVED,
                                todayStart
                        );

        long approvalsYesterday =
                freezeRequestRepository
                        .countByStatusAndUpdatedAtGreaterThanEqualAndUpdatedAtLessThan(
                                FreezeStatus.APPROVED,
                                yesterdayStart,
                                todayStart
                        );

        long suspectedCases = 0;
        long accountsFrozen = 0;
        BigDecimal amountSaved = BigDecimal.ZERO;
        BigDecimal amountSavedToday = BigDecimal.ZERO;

        for (int i = 0; i < fraudCases.size(); i++) {
            FraudCase fraudCase = fraudCases.get(i);
            ActiveCaseResponse response = caseResponses.get(i);

            boolean frozen =
                    "frozen".equals(response.accountStatus());

            if (fraudCase.getRiskLevel() == RiskLevel.MEDIUM
                    && !frozen) {
                suspectedCases++;
            }

            if (frozen) {
                accountsFrozen++;
            }

            boolean actionTaken =
                    !"none".equals(response.freezeStatus())
                            || fraudCase.getAccountStatusOverride() != null;

            if (actionTaken
                    && fraudCase.getEstimatedAmount() != null) {
                amountSaved = amountSaved.add(
                        fraudCase.getEstimatedAmount()
                );

                if (!fraudCase
                        .getCreatedAt()
                        .isBefore(todayStart)) {
                    amountSavedToday =
                            amountSavedToday.add(
                                    fraudCase.getEstimatedAmount()
                            );
                }
            }
        }

        NumberFormat amountFormat =
                NumberFormat.getIntegerInstance(Locale.US);

        return new DashboardStatsResponse(
                criticalToday,
                suspectedCases,
                accountsFrozen,
                amountFormat.format(amountSaved),
                criticalToday - criticalYesterday,
                suspectedToday - suspectedYesterday,
                approvalsToday - approvalsYesterday,
                amountFormat.format(amountSavedToday)
        );
    }

    private ActiveCaseResponse createCaseResponse(
            FraudCase fraudCase
    ) {
        Optional<FreezeRequest> latestFreezeRequest =
                freezeRequestRepository
                        .findFirstByFraudCaseIdOrderByCreatedAtDesc(
                                fraudCase.getId()
                        );

        String caseNumber = latestFreezeRequest
                .map(FreezeRequest::getReportNumber)
                .orElse(
                        createCaseNumber(
                                fraudCase.getId()
                        )
                );

        Long freezeRequestId = latestFreezeRequest
                .map(FreezeRequest::getId)
                .orElse(null);

        String freezeStatus = latestFreezeRequest
                .map(request ->
                        request.getStatus()
                                .name()
                                .toLowerCase(Locale.ROOT)
                )
                .orElse("none");

        String customerName =
                fraudCase.getCustomerName() != null
                        ? fraudCase.getCustomerName()
                        : createCustomerName(fraudCase.getId());

        String fraudPattern =
                fraudCase.getFraudPattern() != null
                        ? fraudCase.getFraudPattern()
                        : detectFraudPattern(
                                fraudCase.getInputText()
                        );

        String accountStatus =
                fraudCase.getAccountStatusOverride() != null
                        ? fraudCase.getAccountStatusOverride()
                        : createAccountStatus(
                                fraudCase.getRiskLevel(),
                                latestFreezeRequest
                        );

        return new ActiveCaseResponse(
                caseNumber,
                fraudCase.getId(),
                fraudCase.getCreatedAt().toString(),
                customerName,
                fraudPattern,
                fraudCase.getRiskScore(),
                fraudCase.getRiskLevel()
                        .name()
                        .toLowerCase(Locale.ROOT),
                accountStatus,
                fraudCase.getNotes(),
                freezeRequestId,
                freezeStatus
        );
    }

    private void publishCaseEvent(
            FraudCase fraudCase,
            ActiveCaseResponse response,
            String eventType
    ) {
        realtimePublishService.publishCase(
                new CaseRealtimeMessage(
                        fraudCase.getId(),
                        eventType,
                        fraudCase.getRiskLevel().name(),
                        fraudCase.getRiskScore(),
                        response.customerName(),
                        response.fraudPattern(),
                        fraudCase.getAccountNumber(),
                        fraudCase.getPhone(),
                        fraudCase.getEstimatedAmount(),
                        fraudCase.getCreatedAt(),
                        eventType.equals("NEW_CASE")
                                ? "تم رصد حالة احتيال جديدة"
                                : "تم تحديث حالة احتيال",
                        eventType.equals("NEW_CASE")
                                ? "New fraud case detected"
                                : "Fraud case updated"
                )
        );
    }

    private void publishNotificationEvent(
            Notification notification,
            String eventType
    ) {
        realtimePublishService.publishNotification(
                new NotificationRealtimeMessage(
                        notification.getId(),
                        eventType,
                        notification.getIcon(),
                        notification.getTitleAr(),
                        notification.getTitleEn(),
                        notification.getBodyAr(),
                        notification.getBodyEn(),
                        notification.getType(),
                        notification.getCaseId(),
                        notification.getCreatedAt()
                )
        );
    }

    private String createAccountStatus(
            RiskLevel riskLevel,
            Optional<FreezeRequest> freezeRequest
    ) {
        if (freezeRequest.isPresent()) {
            FreezeStatus freezeStatus =
                    freezeRequest.get().getStatus();

            if (freezeStatus == FreezeStatus.APPROVED) {
                return "frozen";
            }

            if (freezeStatus == FreezeStatus.PENDING) {
                return "partially_restricted";
            }

            if (freezeStatus == FreezeStatus.REJECTED) {
                return "active";
            }
        }

        if (riskLevel == RiskLevel.CRITICAL) {
            return "partially_restricted";
        }

        return "active";
    }

    private String createCaseNumber(Long caseId) {
        return "FR-" + (9000 + caseId);
    }

    private String createCustomerName(Long caseId) {
        List<String> demoNames = List.of(
                "تركي السفياني",
                "محمد الزهراني",
                "نواف العتيبي",
                "أحمد الحربي"
        );

        int index = (int) (
                (caseId - 1)
                        % demoNames.size()
        );

        return demoNames.get(index);
    }

    private String detectFraudPattern(
            String inputText
    ) {
        String text = normalize(inputText);

        if (containsAny(
                text,
                "otp",
                "رمز التحقق",
                "كود التحقق"
        )) {
            return "احتيال OTP عبر الهندسة الاجتماعية";
        }

        if (containsAny(
                text,
                "شحنه",
                "توصيل",
                "طرد"
        )) {
            return "رابط شحنة أو توصيل وهمي";
        }

        if (containsAny(
                text,
                "استثمار",
                "ارباح",
                "ضاعف اموالك"
        )) {
            return "استثمار احتيالي وأرباح وهمية";
        }

        if (containsAny(
                text,
                "رقم البطاقه",
                "بيانات البطاقه",
                "cvv",
                "الرقم السري"
        )) {
            return "محاولة سرقة بيانات البطاقة";
        }

        if (containsAny(
                text,
                "anydesk",
                "teamviewer",
                "تحكم عن بعد"
        )) {
            return "استخدام برنامج تحكم عن بعد";
        }

        if (containsAny(
                text,
                "http",
                "www.",
                "bit.ly"
        )) {
            return "رابط مالي مشبوه";
        }

        if (containsAny(
                text,
                "تحليل تحويل مالي",
                "مستفيد جديد"
        )) {
            return "تحويل مالي مشتبه به";
        }

        return "محاولة احتيال مالي مشتبه بها";
    }

    private int normalizePageSize(int size) {
        if (size <= 0) {
            return 20;
        }

        return Math.min(size, 100);
    }

    private boolean hasText(String value) {
        return value != null && !value.trim().isEmpty();
    }

    private String trimToNull(String value) {
        if (value == null) {
            return null;
        }

        String trimmed = value.trim();

        return trimmed.isEmpty() ? null : trimmed;
    }

    private boolean containsAny(
            String text,
            String... keywords
    ) {
        for (String keyword : keywords) {
            if (text.contains(normalize(keyword))) {
                return true;
            }
        }

        return false;
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