package com.amanguard.backend.feature.transactionanalysis.dto.response;

import java.util.List;

public record AnalyzeTransactionResponse(
        Long transactionId,
        int riskScore,
        String riskLevel,
        String riskLabelAr,
        String riskLabelEn,
        String action,
        List<TransactionRiskFindingResponse> findings,
        String recommendationAr,
        String recommendationEn,
        String reportNumber
) {
}
