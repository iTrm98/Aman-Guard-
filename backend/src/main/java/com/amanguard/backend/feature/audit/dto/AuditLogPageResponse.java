package com.amanguard.backend.feature.audit.dto;

import java.util.List;

/**
 * Page envelope with exactly the fields the SOC audit page consumes —
 * a stable contract instead of serializing Spring's Page directly.
 */
public record AuditLogPageResponse(
        List<AuditLogResponse> content,
        long totalElements,
        int totalPages,
        int number
) {
}
