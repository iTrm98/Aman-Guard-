package com.amanguard.backend.feature.analytics.service.impl;

import com.amanguard.backend.feature.analytics.dto.AmountSavedPointResponse;
import com.amanguard.backend.feature.analytics.dto.FraudTrendPointResponse;
import com.amanguard.backend.feature.analytics.dto.RiskBreakdownResponse;
import com.amanguard.backend.feature.analytics.dto.TopFraudPatternResponse;
import com.amanguard.backend.feature.analytics.service.AnalyticsService;
import com.amanguard.backend.feature.emergencyfreeze.model.FreezeRequest;
import com.amanguard.backend.feature.emergencyfreeze.model.FreezeStatus;
import com.amanguard.backend.feature.emergencyfreeze.repository.FreezeRequestRepository;
import com.amanguard.backend.feature.fraudanalysis.model.FraudCase;
import com.amanguard.backend.feature.fraudanalysis.model.RiskLevel;
import com.amanguard.backend.feature.fraudanalysis.repository.FraudCaseRepository;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Comparator;
import java.util.EnumMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@Service
@Transactional(readOnly = true)
public class AnalyticsServiceImpl implements AnalyticsService {

    private final FraudCaseRepository fraudCaseRepository;
    private final FreezeRequestRepository freezeRequestRepository;

    public AnalyticsServiceImpl(
            FraudCaseRepository fraudCaseRepository,
            FreezeRequestRepository freezeRequestRepository
    ) {
        this.fraudCaseRepository = fraudCaseRepository;
        this.freezeRequestRepository = freezeRequestRepository;
    }

    @Override
    public List<FraudTrendPointResponse> getFraudTrend(
            int days
    ) {
        int safeDays = normalizeDays(days);

        LocalDate startDate = LocalDate
                .now()
                .minusDays(safeDays - 1L);

        Map<LocalDate, Long> trend = createEmptyLongDateMap(
                startDate,
                safeDays
        );

        List<FraudCase> fraudCases = fraudCaseRepository.findAll(
                Sort.by(
                        Sort.Direction.ASC,
                        "createdAt"
                )
        );

        for (FraudCase fraudCase : fraudCases) {
            LocalDate caseDate = fraudCase
                    .getCreatedAt()
                    .toLocalDate();

            if (!caseDate.isBefore(startDate)) {
                trend.put(
                        caseDate,
                        trend.getOrDefault(caseDate, 0L) + 1L
                );
            }
        }

        return trend
                .entrySet()
                .stream()
                .map(entry ->
                        new FraudTrendPointResponse(
                                entry.getKey().toString(),
                                entry.getValue()
                        )
                )
                .toList();
    }

    @Override
    public List<RiskBreakdownResponse> getRiskBreakdown() {
        Map<RiskLevel, Long> breakdown =
                new EnumMap<>(RiskLevel.class);

        for (RiskLevel riskLevel : RiskLevel.values()) {
            breakdown.put(riskLevel, 0L);
        }

        List<FraudCase> fraudCases =
                fraudCaseRepository.findAll();

        for (FraudCase fraudCase : fraudCases) {
            RiskLevel riskLevel = fraudCase.getRiskLevel();

            breakdown.put(
                    riskLevel,
                    breakdown.getOrDefault(riskLevel, 0L) + 1L
            );
        }

        return breakdown
                .entrySet()
                .stream()
                .map(entry ->
                        new RiskBreakdownResponse(
                                entry.getKey()
                                        .name()
                                        .toLowerCase(Locale.ROOT),
                                entry.getValue()
                        )
                )
                .toList();
    }

    @Override
    public List<TopFraudPatternResponse> getTopFraudPatterns(
            int limit
    ) {
        int safeLimit = normalizeLimit(limit);

        Map<String, Long> patterns = new LinkedHashMap<>();

        List<FraudCase> fraudCases =
                fraudCaseRepository.findAll();

        for (FraudCase fraudCase : fraudCases) {
            String pattern = fraudCase.getFraudPattern();

            if (pattern == null || pattern.isBlank()) {
                pattern = detectFraudPattern(
                        fraudCase.getInputText()
                );
            }

            patterns.put(
                    pattern,
                    patterns.getOrDefault(pattern, 0L) + 1L
            );
        }

        return patterns
                .entrySet()
                .stream()
                .sorted(
                        Map.Entry
                                .<String, Long>comparingByValue()
                                .reversed()
                )
                .limit(safeLimit)
                .map(entry ->
                        new TopFraudPatternResponse(
                                entry.getKey(),
                                entry.getValue()
                        )
                )
                .toList();
    }

    @Override
    public List<AmountSavedPointResponse> getAmountSavedTrend(
            int days
    ) {
        int safeDays = normalizeDays(days);

        LocalDate startDate = LocalDate
                .now()
                .minusDays(safeDays - 1L);

        Map<LocalDate, BigDecimal> trend =
                createEmptyAmountDateMap(
                        startDate,
                        safeDays
                );

        List<FraudCase> fraudCases =
                fraudCaseRepository.findAll(
                        Sort.by(
                                Sort.Direction.ASC,
                                "createdAt"
                        )
                );

        for (FraudCase fraudCase : fraudCases) {
            if (fraudCase.getEstimatedAmount() == null) {
                continue;
            }

            LocalDate caseDate = fraudCase
                    .getCreatedAt()
                    .toLocalDate();

            if (caseDate.isBefore(startDate)) {
                continue;
            }

            boolean saved =
                    isApprovedFreeze(fraudCase)
                            || fraudCase.getRiskLevel() == RiskLevel.CRITICAL;

            if (!saved) {
                continue;
            }

            BigDecimal currentAmount =
                    trend.getOrDefault(
                            caseDate,
                            BigDecimal.ZERO
                    );

            trend.put(
                    caseDate,
                    currentAmount.add(
                            fraudCase.getEstimatedAmount()
                    )
            );
        }

        return trend
                .entrySet()
                .stream()
                .map(entry ->
                        new AmountSavedPointResponse(
                                entry.getKey().toString(),
                                entry.getValue()
                        )
                )
                .toList();
    }

    private boolean isApprovedFreeze(
            FraudCase fraudCase
    ) {
        return freezeRequestRepository
                .findFirstByFraudCaseIdOrderByCreatedAtDesc(
                        fraudCase.getId()
                )
                .map(FreezeRequest::getStatus)
                .map(status -> status == FreezeStatus.APPROVED)
                .orElse(false);
    }

    private Map<LocalDate, Long> createEmptyLongDateMap(
            LocalDate startDate,
            int days
    ) {
        Map<LocalDate, Long> map = new LinkedHashMap<>();

        for (int i = 0; i < days; i++) {
            map.put(
                    startDate.plusDays(i),
                    0L
            );
        }

        return map;
    }

    private Map<LocalDate, BigDecimal> createEmptyAmountDateMap(
            LocalDate startDate,
            int days
    ) {
        Map<LocalDate, BigDecimal> map =
                new LinkedHashMap<>();

        for (int i = 0; i < days; i++) {
            map.put(
                    startDate.plusDays(i),
                    BigDecimal.ZERO
            );
        }

        return map;
    }

    private int normalizeDays(int days) {
        if (days <= 0) {
            return 30;
        }

        return Math.min(days, 90);
    }

    private int normalizeLimit(int limit) {
        if (limit <= 0) {
            return 5;
        }

        return Math.min(limit, 20);
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