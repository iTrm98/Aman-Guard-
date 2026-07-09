package com.amanguard.backend.feature.dashboard.controller;

import com.amanguard.backend.feature.dashboard.dto.request.CreateCaseRequest;
import com.amanguard.backend.feature.dashboard.dto.request.UpdateCaseRequest;
import com.amanguard.backend.feature.dashboard.dto.response.ActiveCaseResponse;
import com.amanguard.backend.feature.dashboard.dto.response.DashboardResponse;
import com.amanguard.backend.feature.dashboard.service.DashboardService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
public class DashboardController {

    private final DashboardService dashboardService;

    public DashboardController(
            DashboardService dashboardService
    ) {
        this.dashboardService = dashboardService;
    }

    @GetMapping("/cases/active")
    public ResponseEntity<DashboardResponse> getActiveCases(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        DashboardResponse response =
                dashboardService.getActiveCases(
                        page,
                        size
                );

        return ResponseEntity.ok(response);
    }

    @GetMapping("/cases/{caseId}")
    public ResponseEntity<ActiveCaseResponse> getCase(
            @PathVariable Long caseId
    ) {
        return ResponseEntity.ok(
                dashboardService.getCaseById(caseId)
        );
    }

    @PostMapping("/cases")
    public ResponseEntity<ActiveCaseResponse> createCase(
            @Valid @RequestBody CreateCaseRequest request
    ) {
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(
                        dashboardService.createCase(request)
                );
    }

    @PutMapping("/cases/{caseId}")
    public ResponseEntity<ActiveCaseResponse> updateCase(
            @PathVariable Long caseId,
            @Valid @RequestBody UpdateCaseRequest request
    ) {
        return ResponseEntity.ok(
                dashboardService.updateCase(
                        caseId,
                        request
                )
        );
    }
}