package com.amanguard.backend.feature.verification.controller;

import com.amanguard.backend.feature.verification.dto.request.EvaluateVerificationRequest;
import com.amanguard.backend.feature.verification.dto.response.EvaluateVerificationResponse;
import com.amanguard.backend.feature.verification.service.VerificationService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/verifications")
public class VerificationController {

    private final VerificationService verificationService;

    public VerificationController(
            VerificationService verificationService
    ) {
        this.verificationService =
                verificationService;
    }

    @PostMapping("/evaluate")
    public ResponseEntity<EvaluateVerificationResponse> evaluate(
            @Valid
            @RequestBody
            EvaluateVerificationRequest request
    ) {
        EvaluateVerificationResponse response =
                verificationService.evaluate(request);

        return ResponseEntity.ok(response);
    }
}