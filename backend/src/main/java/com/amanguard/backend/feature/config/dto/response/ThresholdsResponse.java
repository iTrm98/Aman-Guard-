package com.amanguard.backend.feature.config.dto.response;

import java.math.BigDecimal;

public record ThresholdsResponse(
        BigDecimal maxPurchaseAmount,
        String currency
) {
}
