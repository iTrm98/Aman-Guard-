package com.amanguard.backend.feature.audit.service;

import com.amanguard.backend.feature.audit.dto.AuditLogPageResponse;
import com.amanguard.backend.feature.audit.dto.AuditLogResponse;

import java.time.LocalDate;
import java.util.List;

public interface AuditLogService {

    void recordUserAction(
            String userId,
            String userRole,
            String action,
            String httpMethod,
            String path,
            String queryString,
            int statusCode,
            String ipAddress,
            String userAgent
    );

    AuditLogPageResponse searchLogs(
            int page,
            int size,
            LocalDate from,
            LocalDate to,
            String action,
            String search
    );

    List<AuditLogResponse> getOfficerLogs(
            String officerId,
            int limit
    );
}
