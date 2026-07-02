package com.amanguard.backend.feature.transactionanalysis.service;

import com.amanguard.backend.feature.transactionanalysis.dto.request.AnalyzeTransactionRequest;
import com.amanguard.backend.feature.transactionanalysis.dto.response.AnalyzeTransactionResponse;
import com.amanguard.backend.feature.transactionanalysis.dto.response.TransactionDecisionResponse;

public interface TransactionAnalysisService {

    AnalyzeTransactionResponse analyze(
            AnalyzeTransactionRequest request
    );

    TransactionDecisionResponse confirm(
            Long transactionId
    );

    TransactionDecisionResponse cancel(
            Long transactionId
    );
}
