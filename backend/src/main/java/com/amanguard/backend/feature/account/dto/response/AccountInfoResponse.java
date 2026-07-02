package com.amanguard.backend.feature.account.dto.response;

import java.math.BigDecimal;

public record AccountInfoResponse(
        String iban,
        String maskedIban,
        BigDecimal balance,
        String currency,
        String status,
        String securityStatus,
        AccountStatsResponse stats
) {
}
