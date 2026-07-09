package com.amanguard.backend.feature.analytics.dto;

import java.math.BigDecimal;

public record AmountSavedPointResponse(
        String date,
        BigDecimal amount
) {
}