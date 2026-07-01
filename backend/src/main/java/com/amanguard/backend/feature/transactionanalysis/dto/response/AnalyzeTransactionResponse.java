package com.amanguard.backend.feature.transactionanalysis.dto.response;

import java.math.BigDecimal;
import java.util.List;

public record AnalyzeTransactionResponse(
        Long analysisId,
        Long caseId,
        BigDecimal amount,
        int riskScore,
        String riskLevel,
        String riskLabel,
        List<TransactionRiskFindingResponse> findings,
        String recommendation,
        boolean verificationRequired
) {
}