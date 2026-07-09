package com.amanguard.backend.feature.integration.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record OpenBankingAccountSummaryResponse(
        String provider,
        String accountNumber,
        String maskedAccountNumber,
        BigDecimal availableBalance,
        BigDecimal currentBalance,
        String currency,
        String accountStatus,
        LocalDateTime fetchedAt,
        String todo
) {
}