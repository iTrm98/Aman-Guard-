package com.amanguard.backend.feature.dashboard.service.impl;

import com.amanguard.backend.feature.dashboard.dto.response.ActiveCaseResponse;
import com.amanguard.backend.feature.dashboard.dto.response.DashboardResponse;
import com.amanguard.backend.feature.dashboard.dto.response.DashboardStatsResponse;
import com.amanguard.backend.feature.dashboard.service.DashboardService;
import com.amanguard.backend.feature.emergencyfreeze.model.FreezeRequest;
import com.amanguard.backend.feature.emergencyfreeze.model.FreezeStatus;
import com.amanguard.backend.feature.emergencyfreeze.repository.FreezeRequestRepository;
import com.amanguard.backend.feature.fraudanalysis.model.FraudCase;
import com.amanguard.backend.feature.fraudanalysis.model.RiskLevel;
import com.amanguard.backend.feature.fraudanalysis.repository.FraudCaseRepository;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.text.NumberFormat;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;
import java.util.Optional;

@Service
public class DashboardServiceImpl
        implements DashboardService {

    private static final long ESTIMATED_AMOUNT_PER_FROZEN_CASE =
            5000;

    private final FraudCaseRepository fraudCaseRepository;
    private final FreezeRequestRepository freezeRequestRepository;

    public DashboardServiceImpl(
            FraudCaseRepository fraudCaseRepository,
            FreezeRequestRepository freezeRequestRepository
    ) {
        this.fraudCaseRepository =
                fraudCaseRepository;

        this.freezeRequestRepository =
                freezeRequestRepository;
    }

    @Override
    public DashboardResponse getActiveCases() {
        List<FraudCase> fraudCases =
                fraudCaseRepository.findAll(
                        Sort.by(
                                Sort.Direction.DESC,
                                "createdAt"
                        )
                );

        DashboardStatsResponse stats =
                createStats(fraudCases);

        List<ActiveCaseResponse> cases =
                fraudCases.stream()
                        .limit(20)
                        .map(this::createCaseResponse)
                        .toList();

        return new DashboardResponse(
                stats,
                cases
        );
    }

    private DashboardStatsResponse createStats(
            List<FraudCase> fraudCases
    ) {
        LocalDate today = LocalDate.now();

        long criticalToday = fraudCases.stream()
                .filter(fraudCase ->
                        fraudCase.getRiskLevel()
                                == RiskLevel.CRITICAL
                )
                .filter(fraudCase ->
                        fraudCase.getCreatedAt()
                                .toLocalDate()
                                .equals(today)
                )
                .count();

        long suspectedCases = fraudCases.stream()
                .filter(fraudCase ->
                        fraudCase.getRiskScore() >= 30
                )
                .count();

        long accountsFrozen =
                freezeRequestRepository.countByStatus(
                        FreezeStatus.APPROVED
                );

        long estimatedAmountSaved =
                accountsFrozen
                        * ESTIMATED_AMOUNT_PER_FROZEN_CASE;

        String formattedAmount = NumberFormat
                .getIntegerInstance(Locale.US)
                .format(estimatedAmountSaved);

        return new DashboardStatsResponse(
                criticalToday,
                suspectedCases,
                accountsFrozen,
                formattedAmount
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

        return new ActiveCaseResponse(
                caseNumber,
                createTimeAgo(fraudCase.getCreatedAt()),
                createCustomerName(fraudCase.getId()),
                detectFraudPattern(
                        fraudCase.getInputText()
                ),
                fraudCase.getRiskScore(),
                fraudCase.getRiskLevel()
                        .name()
                        .toLowerCase(Locale.ROOT),
                createAccountStatus(
                        fraudCase.getRiskLevel(),
                        latestFreezeRequest
                ),
                freezeRequestId,
                freezeStatus
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

    private String createTimeAgo(
            LocalDateTime createdAt
    ) {
        Duration duration = Duration.between(
                createdAt,
                LocalDateTime.now()
        );

        long minutes = duration.toMinutes();

        if (minutes < 1) {
            return "الآن";
        }

        if (minutes < 60) {
            return "منذ " + minutes + " دقيقة";
        }

        long hours = duration.toHours();

        if (hours < 24) {
            return "منذ " + hours + " ساعة";
        }

        long days = duration.toDays();

        return "منذ " + days + " يوم";
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