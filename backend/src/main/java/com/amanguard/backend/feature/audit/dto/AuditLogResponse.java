package com.amanguard.backend.feature.audit.dto;

import com.amanguard.backend.feature.audit.model.AuditLog;

import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public record AuditLogResponse(
        Long id,
        String userId,
        String userRole,
        String action,
        String entityType,
        String entityId,
        String ipAddress,
        int httpStatus,
        OffsetDateTime createdAt
) {

    private static final ZoneId RIYADH = ZoneId.of("Asia/Riyadh");

    // Entity references are derived from the stored request path (there are no
    // entity columns in audit_logs). Only numeric id segments count — this
    // keeps "/api/cases/active" from being read as FraudCase #active.
    private static final Pattern ENTITY_PATH = Pattern.compile(
            "^/api/(cases|freeze|transactions|customers|notifications)/(\\d+)"
    );

    private static final Map<String, String> ENTITY_TYPES = Map.of(
            "cases", "FraudCase",
            "freeze", "FreezeRequest",
            "transactions", "Transaction",
            "customers", "Customer",
            "notifications", "Notification"
    );

    public static AuditLogResponse from(AuditLog auditLog) {
        String entityType = null;
        String entityId = null;

        String path = auditLog.getPath();
        if (path != null) {
            Matcher matcher = ENTITY_PATH.matcher(path);
            if (matcher.find()) {
                entityType = ENTITY_TYPES.get(matcher.group(1));
                entityId = matcher.group(2);
            }
        }

        // Stored timestamps are server-local LocalDateTime; expose them as
        // ISO-8601 with the Saudi offset (e.g. 2026-07-10T14:32:11+03:00).
        OffsetDateTime createdAt = auditLog
                .getCreatedAt()
                .atZone(ZoneId.systemDefault())
                .withZoneSameInstant(RIYADH)
                .toOffsetDateTime();

        return new AuditLogResponse(
                auditLog.getId(),
                auditLog.getOfficerId(),
                auditLog.getUserRole(),
                auditLog.getAction(),
                entityType,
                entityId,
                auditLog.getIpAddress(),
                auditLog.getStatusCode(),
                createdAt
        );
    }
}
