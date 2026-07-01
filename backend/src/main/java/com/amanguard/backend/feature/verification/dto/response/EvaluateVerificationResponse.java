package com.amanguard.backend.feature.verification.dto.response;

public record EvaluateVerificationResponse(
        Long verificationId,
        Long caseId,
        int previousRiskScore,
        int addedRiskScore,
        int finalRiskScore,
        String riskLevel,
        String riskLabel,
        String recommendedAction,
        String message
) {
}