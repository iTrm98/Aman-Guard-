package com.amanguard.backend.feature.verification.service;

import com.amanguard.backend.feature.verification.dto.request.EvaluateVerificationRequest;
import com.amanguard.backend.feature.verification.dto.response.EvaluateVerificationResponse;

public interface VerificationService {

    EvaluateVerificationResponse evaluate(
            EvaluateVerificationRequest request
    );
}