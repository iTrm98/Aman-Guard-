package com.amanguard.backend.feature.dashboard.controller;

import com.amanguard.backend.feature.dashboard.dto.response.DashboardResponse;
import com.amanguard.backend.feature.dashboard.service.DashboardService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

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
    public ResponseEntity<DashboardResponse> getActiveCases() {
        DashboardResponse response =
                dashboardService.getActiveCases();

        return ResponseEntity.ok(response);
    }
}