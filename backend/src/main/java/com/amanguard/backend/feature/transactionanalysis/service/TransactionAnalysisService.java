package com.amanguard.backend.feature.transactionanalysis.service;

import com.amanguard.backend.feature.transactionanalysis.dto.request.AnalyzeTransactionRequest;
import com.amanguard.backend.feature.transactionanalysis.dto.response.AnalyzeTransactionResponse;

public interface TransactionAnalysisService {

    AnalyzeTransactionResponse analyze(
            AnalyzeTransactionRequest request
    );
}