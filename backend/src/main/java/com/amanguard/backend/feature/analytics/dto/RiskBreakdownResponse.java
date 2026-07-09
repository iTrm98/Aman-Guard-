package com.amanguard.backend.feature.analytics.dto;

public record RiskBreakdownResponse(
        String riskLevel,
        long count
) {
}