package com.amanguard.backend.feature.emergencyfreeze.dto.response;

import java.time.LocalDateTime;

public record FreezeRequestStatusResponse(
        Long requestId,
        Long caseId,
        String reportNumber,
        String status,
        String message,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}