package com.amanguard.backend.feature.audit.service;

import com.amanguard.backend.feature.audit.dto.AuditLogResponse;

import java.util.List;

public interface AuditLogService {

    void recordOfficerAction(
            String officerId,
            String action,
            String httpMethod,
            String path,
            String queryString,
            int statusCode,
            String ipAddress,
            String userAgent
    );

    List<AuditLogResponse> getLatestLogs(int limit);

    List<AuditLogResponse> getOfficerLogs(
            String officerId,
            int limit
    );
}