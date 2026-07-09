package com.amanguard.backend.feature.analytics.dto;

public record FraudTrendPointResponse(
        String date,
        long cases
) {
}