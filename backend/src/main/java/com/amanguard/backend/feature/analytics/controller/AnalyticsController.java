package com.amanguard.backend.feature.analytics.controller;

import com.amanguard.backend.feature.analytics.dto.AmountSavedPointResponse;
import com.amanguard.backend.feature.analytics.dto.FraudTrendPointResponse;
import com.amanguard.backend.feature.analytics.dto.RiskBreakdownResponse;
import com.amanguard.backend.feature.analytics.dto.TopFraudPatternResponse;
import com.amanguard.backend.feature.analytics.service.AnalyticsService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/analytics")
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    public AnalyticsController(
            AnalyticsService analyticsService
    ) {
        this.analyticsService = analyticsService;
    }

    @GetMapping("/fraud-trend")
    public ResponseEntity<List<FraudTrendPointResponse>> getFraudTrend(
            @RequestParam(defaultValue = "30") int days
    ) {
        return ResponseEntity.ok(
                analyticsService.getFraudTrend(days)
        );
    }

    @GetMapping("/risk-breakdown")
    public ResponseEntity<List<RiskBreakdownResponse>> getRiskBreakdown() {
        return ResponseEntity.ok(
                analyticsService.getRiskBreakdown()
        );
    }

    @GetMapping("/top-patterns")
    public ResponseEntity<List<TopFraudPatternResponse>> getTopFraudPatterns(
            @RequestParam(defaultValue = "5") int limit
    ) {
        return ResponseEntity.ok(
                analyticsService.getTopFraudPatterns(limit)
        );
    }

    @GetMapping("/amount-saved")
    public ResponseEntity<List<AmountSavedPointResponse>> getAmountSavedTrend(
            @RequestParam(defaultValue = "30") int days
    ) {
        return ResponseEntity.ok(
                analyticsService.getAmountSavedTrend(days)
        );
    }
}