package com.amanguard.backend.feature.audit.service.impl;

import com.amanguard.backend.feature.audit.dto.AuditLogPageResponse;
import com.amanguard.backend.feature.audit.dto.AuditLogResponse;
import com.amanguard.backend.feature.audit.model.AuditLog;
import com.amanguard.backend.feature.audit.repository.AuditLogRepository;
import com.amanguard.backend.feature.audit.service.AuditLogService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;

@Service
@Transactional
public class AuditLogServiceImpl implements AuditLogService {

    private static final ZoneId RIYADH = ZoneId.of("Asia/Riyadh");
    private static final LocalDate EARLIEST = LocalDate.of(2000, 1, 1);
    private static final int MAX_PAGE_SIZE = 5000;

    private final AuditLogRepository auditLogRepository;

    public AuditLogServiceImpl(
            AuditLogRepository auditLogRepository
    ) {
        this.auditLogRepository = auditLogRepository;
    }

    @Override
    public void recordUserAction(
            String userId,
            String userRole,
            String action,
            String httpMethod,
            String path,
            String queryString,
            int statusCode,
            String ipAddress,
            String userAgent
    ) {
        AuditLog auditLog = new AuditLog(
                safe(userId, 50),
                safe(userRole, 20),
                safe(action, 120),
                safe(httpMethod, 10),
                safe(path, 500),
                safeNullable(queryString, 1000),
                statusCode,
                safeNullable(ipAddress, 80),
                safeNullable(userAgent, 500),
                LocalDateTime.now()
        );

        auditLogRepository.save(auditLog);
    }

    @Override
    @Transactional(readOnly = true)
    public AuditLogPageResponse searchLogs(
            int page,
            int size,
            LocalDate from,
            LocalDate to,
            String action,
            String search
    ) {
        int safePage = Math.max(page, 0);
        int safeSize = size <= 0 ? 20 : Math.min(size, MAX_PAGE_SIZE);

        // The filter dates are Saudi calendar days; convert their boundaries
        // to the server-local LocalDateTime the rows are stored in. The end
        // bound is exclusive (start of the day after "to").
        LocalDate fromDay = from != null ? from : EARLIEST;
        LocalDate toDayExclusive =
                (to != null ? to : LocalDate.now(RIYADH)).plusDays(1);

        LocalDateTime fromLdt = toServerLocal(fromDay);
        LocalDateTime toLdt = toServerLocal(toDayExclusive);

        Page<AuditLog> result = auditLogRepository.search(
                fromLdt,
                toLdt,
                blankToNull(action),
                blankToNull(search),
                PageRequest.of(safePage, safeSize)
        );

        return new AuditLogPageResponse(
                result.getContent()
                        .stream()
                        .map(AuditLogResponse::from)
                        .toList(),
                result.getTotalElements(),
                result.getTotalPages(),
                result.getNumber()
        );
    }

    @Override
    @Transactional(readOnly = true)
    public List<AuditLogResponse> getOfficerLogs(
            String officerId,
            int limit
    ) {
        int safeLimit = normalizeLimit(limit);

        return auditLogRepository
                .findByOfficerIdOrderByCreatedAtDesc(
                        officerId,
                        PageRequest.of(0, safeLimit)
                )
                .stream()
                .map(AuditLogResponse::from)
                .toList();
    }

    private LocalDateTime toServerLocal(LocalDate riyadhDay) {
        return riyadhDay
                .atStartOfDay(RIYADH)
                .withZoneSameInstant(ZoneId.systemDefault())
                .toLocalDateTime();
    }

    private String blankToNull(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }

        return value.trim();
    }

    private int normalizeLimit(int limit) {
        if (limit <= 0) {
            return 20;
        }

        return Math.min(limit, 100);
    }

    private String safe(
            String value,
            int maxLength
    ) {
        if (value == null || value.isBlank()) {
            return "UNKNOWN";
        }

        if (value.length() <= maxLength) {
            return value;
        }

        return value.substring(0, maxLength);
    }

    private String safeNullable(
            String value,
            int maxLength
    ) {
        if (value == null || value.isBlank()) {
            return null;
        }

        if (value.length() <= maxLength) {
            return value;
        }

        return value.substring(0, maxLength);
    }
}
