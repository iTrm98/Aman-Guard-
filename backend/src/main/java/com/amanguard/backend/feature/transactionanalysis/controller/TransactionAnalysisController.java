package com.amanguard.backend.feature.transactionanalysis.controller;

import com.amanguard.backend.feature.transactionanalysis.dto.request.AnalyzeTransactionRequest;
import com.amanguard.backend.feature.transactionanalysis.dto.response.AnalyzeTransactionResponse;
import com.amanguard.backend.feature.transactionanalysis.service.TransactionAnalysisService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/transactions")
public class TransactionAnalysisController {

    private final TransactionAnalysisService transactionAnalysisService;

    public TransactionAnalysisController(
            TransactionAnalysisService transactionAnalysisService
    ) {
        this.transactionAnalysisService =
                transactionAnalysisService;
    }

    @PostMapping("/analyze")
    public ResponseEntity<AnalyzeTransactionResponse> analyze(
            @Valid @RequestBody AnalyzeTransactionRequest request
    ) {
        AnalyzeTransactionResponse response =
                transactionAnalysisService.analyze(request);

        return ResponseEntity.ok(response);
    }
}