package com.amanguard.backend.feature.integration.dto;

import java.time.LocalDateTime;

public record TelephonyVerificationResponse(
        String provider,
        String callerNumber,
        String claimedInstitution,
        boolean registeredNumber,
        boolean trustedInstitution,
        String riskLevel,
        String recommendation,
        LocalDateTime checkedAt,
        String todo
) {
}