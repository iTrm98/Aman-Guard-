package com.amanguard.backend.feature.fraudanalysis.controller;

import com.amanguard.backend.feature.fraudanalysis.dto.request.AnalyzeFraudRequest;
import com.amanguard.backend.feature.fraudanalysis.dto.response.AnalyzeFraudResponse;
import com.amanguard.backend.feature.fraudanalysis.service.FraudAnalysisService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
public class FraudAnalysisController {

    private final FraudAnalysisService fraudAnalysisService;

    public FraudAnalysisController(
            FraudAnalysisService fraudAnalysisService
    ) {
        this.fraudAnalysisService = fraudAnalysisService;
    }

    @PostMapping("/analyze")
    public ResponseEntity<AnalyzeFraudResponse> analyze(
            @Valid @RequestBody AnalyzeFraudRequest request
    ) {
        AnalyzeFraudResponse response =
                fraudAnalysisService.analyze(request.text());

        return ResponseEntity.ok(response);
    }
}