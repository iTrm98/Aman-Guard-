package com.amanguard.backend.feature.audit.service.impl;

import com.amanguard.backend.feature.audit.dto.AuditLogResponse;
import com.amanguard.backend.feature.audit.model.AuditLog;
import com.amanguard.backend.feature.audit.repository.AuditLogRepository;
import com.amanguard.backend.feature.audit.service.AuditLogService;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@Transactional
public class AuditLogServiceImpl implements AuditLogService {

    private final AuditLogRepository auditLogRepository;

    public AuditLogServiceImpl(
            AuditLogRepository auditLogRepository
    ) {
        this.auditLogRepository = auditLogRepository;
    }

    @Override
    public void recordOfficerAction(
            String officerId,
            String action,
            String httpMethod,
            String path,
            String queryString,
            int statusCode,
            String ipAddress,
            String userAgent
    ) {
        AuditLog auditLog = new AuditLog(
                safe(officerId, 50),
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
    public List<AuditLogResponse> getLatestLogs(int limit) {
        int safeLimit = normalizeLimit(limit);

        return auditLogRepository
                .findAllByOrderByCreatedAtDesc(
                        PageRequest.of(0, safeLimit)
                )
                .stream()
                .map(AuditLogResponse::from)
                .toList();
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