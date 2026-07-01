package com.amanguard.backend.feature.emergencyfreeze.controller;

import com.amanguard.backend.feature.emergencyfreeze.dto.request.FreezeAccountRequest;
import com.amanguard.backend.feature.emergencyfreeze.dto.response.FreezeAccountResponse;
import com.amanguard.backend.feature.emergencyfreeze.dto.response.FreezeRequestStatusResponse;
import com.amanguard.backend.feature.emergencyfreeze.service.EmergencyFreezeService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/freeze")
public class EmergencyFreezeController {

    private final EmergencyFreezeService emergencyFreezeService;

    public EmergencyFreezeController(
            EmergencyFreezeService emergencyFreezeService
    ) {
        this.emergencyFreezeService =
                emergencyFreezeService;
    }

    @PostMapping
    public ResponseEntity<FreezeAccountResponse> requestFreeze(
            @Valid
            @RequestBody
            FreezeAccountRequest request
    ) {
        FreezeAccountResponse response =
                emergencyFreezeService.requestFreeze(
                        request.caseId(),
                        request.reason()
                );

        return ResponseEntity.ok(response);
    }

    @GetMapping("/{requestId}")
    public ResponseEntity<FreezeRequestStatusResponse>
    getRequestStatus(
            @PathVariable Long requestId
    ) {
        FreezeRequestStatusResponse response =
                emergencyFreezeService
                        .getRequestStatus(requestId);

        return ResponseEntity.ok(response);
    }

    @PatchMapping("/{requestId}/approve")
    public ResponseEntity<FreezeRequestStatusResponse>
    approveRequest(
            @PathVariable Long requestId
    ) {
        FreezeRequestStatusResponse response =
                emergencyFreezeService
                        .approveRequest(requestId);

        return ResponseEntity.ok(response);
    }

    @PatchMapping("/{requestId}/reject")
    public ResponseEntity<FreezeRequestStatusResponse>
    rejectRequest(
            @PathVariable Long requestId
    ) {
        FreezeRequestStatusResponse response =
                emergencyFreezeService
                        .rejectRequest(requestId);

        return ResponseEntity.ok(response);
    }
}