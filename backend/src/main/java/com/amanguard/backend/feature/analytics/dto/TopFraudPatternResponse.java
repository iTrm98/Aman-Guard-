package com.amanguard.backend.feature.analytics.dto;

public record TopFraudPatternResponse(
        String fraudPattern,
        long count
) {
}