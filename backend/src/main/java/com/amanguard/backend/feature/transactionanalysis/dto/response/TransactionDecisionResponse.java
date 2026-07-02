package com.amanguard.backend.feature.transactionanalysis.dto.response;

// caseId is only set on cancel: the created "محاولة شراء غير مصرحة" fraud case,
// which the frontend passes to POST /freeze (that endpoint requires a caseId).
public record TransactionDecisionResponse(
        boolean success,
        String message,
        Long caseId
) {
}
