package com.amanguard.backend.feature.fraudanalysis.dto.response;

import java.util.List;

public record AnalyzeFraudResponse(
        int riskScore,
        String riskLevel,
        String riskLabel,
        List<RiskFindingResponse> findings,
        String recommendation,
        List<InterruptionQuestionResponse> interruptionQuestions,
        Long caseId
) {
}