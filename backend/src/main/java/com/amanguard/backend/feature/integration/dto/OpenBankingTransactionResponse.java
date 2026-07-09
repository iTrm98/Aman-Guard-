package com.amanguard.backend.feature.integration.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record OpenBankingTransactionResponse(
        String transactionId,
        String accountNumber,
        BigDecimal amount,
        String currency,
        String direction,
        String merchantName,
        String category,
        String channel,
        LocalDateTime occurredAt,
        String status
) {
}