package com.amanguard.backend.feature.fraudanalysis.dto.response;

import java.util.List;

public record AnalyzeFraudResponse(
        int riskScore,
        String riskLevel,
        String riskLabelAr,
        String riskLabelEn,
        List<RiskFindingResponse> findings,
        String recommendationAr,
        String recommendationEn,
        List<InterruptionQuestionResponse> interruptionQuestions,
        Long caseId,
        String analysisSource
) {
}
