package com.amanguard.backend.feature.dashboard.dto.response;

public record ActiveCaseResponse(
        String id,
        String timeAgo,
        String customerName,
        String fraudPattern,
        int riskScore,
        String riskLevel,
        String accountStatus,
        Long freezeRequestId,
        String freezeStatus
) {
}