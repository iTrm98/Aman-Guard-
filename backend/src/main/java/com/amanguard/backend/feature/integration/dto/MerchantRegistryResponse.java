package com.amanguard.backend.feature.integration.dto;

import java.time.LocalDateTime;

public record MerchantRegistryResponse(
        String provider,
        String crNumber,
        String merchantName,
        boolean verified,
        String status,
        String riskLevel,
        String recommendation,
        LocalDateTime checkedAt,
        String todo
) {
}