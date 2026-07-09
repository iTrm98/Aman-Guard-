package com.amanguard.backend.feature.audit.dto;

import com.amanguard.backend.feature.audit.model.AuditLog;

import java.time.LocalDateTime;

public record AuditLogResponse(
        Long id,
        String officerId,
        String action,
        String httpMethod,
        String path,
        String queryString,
        int statusCode,
        String ipAddress,
        String userAgent,
        LocalDateTime createdAt
) {

    public static AuditLogResponse from(AuditLog auditLog) {
        return new AuditLogResponse(
                auditLog.getId(),
                auditLog.getOfficerId(),
                auditLog.getAction(),
                auditLog.getHttpMethod(),
                auditLog.getPath(),
                auditLog.getQueryString(),
                auditLog.getStatusCode(),
                auditLog.getIpAddress(),
                auditLog.getUserAgent(),
                auditLog.getCreatedAt()
        );
    }
}