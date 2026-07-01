package com.amanguard.backend.feature.fraudanalysis.service;

import com.amanguard.backend.feature.fraudanalysis.dto.response.AnalyzeFraudResponse;

public interface FraudAnalysisService {

    AnalyzeFraudResponse analyze(String text);
}