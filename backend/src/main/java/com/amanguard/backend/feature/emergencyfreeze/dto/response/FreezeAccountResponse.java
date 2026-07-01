package com.amanguard.backend.feature.emergencyfreeze.dto.response;

public record FreezeAccountResponse(
        Long requestId,
        boolean success,
        String reportNumber,
        String status,
        String message
) {
}