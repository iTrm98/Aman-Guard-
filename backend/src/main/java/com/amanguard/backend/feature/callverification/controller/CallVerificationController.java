package com.amanguard.backend.feature.callverification.controller;

import com.amanguard.backend.feature.callverification.dto.response.CallStatusResponse;
import com.amanguard.backend.feature.callverification.service.CallVerificationService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
public class CallVerificationController {

    private final CallVerificationService callVerificationService;

    public CallVerificationController(
            CallVerificationService callVerificationService
    ) {
        this.callVerificationService =
                callVerificationService;
    }

    @GetMapping("/call-status")
    public ResponseEntity<CallStatusResponse> getCallStatus(
            @RequestParam(
                    required = false
            ) String phoneNumber
    ) {
        CallStatusResponse response =
                callVerificationService.verifyCall(phoneNumber);

        return ResponseEntity.ok(response);
    }
}