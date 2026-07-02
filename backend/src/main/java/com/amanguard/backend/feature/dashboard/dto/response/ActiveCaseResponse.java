package com.amanguard.backend.feature.dashboard.dto.response;

public record ActiveCaseResponse(
        String id,
        Long caseId,
        String createdAt,
        String customerName,
        String fraudPattern,
        int riskScore,
        String riskLevel,
        String accountStatus,
        String notes,
        Long freezeRequestId,
        String freezeStatus
) {
}
