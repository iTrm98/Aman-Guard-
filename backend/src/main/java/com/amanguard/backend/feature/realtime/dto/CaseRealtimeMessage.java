package com.amanguard.backend.feature.realtime.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record CaseRealtimeMessage(
        Long caseId,
        String eventType,
        String riskLevel,
        Integer riskScore,
        String customerName,
        String fraudPattern,
        String accountNumber,
        String phone,
        BigDecimal estimatedAmount,
        LocalDateTime createdAt,
        String messageAr,
        String messageEn
) {
}