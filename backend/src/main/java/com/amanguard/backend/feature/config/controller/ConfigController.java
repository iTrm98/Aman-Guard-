package com.amanguard.backend.feature.config.controller;

import com.amanguard.backend.feature.config.dto.response.ThresholdsResponse;
import com.amanguard.backend.feature.config.service.FraudConfigService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/config")
public class ConfigController {

    private final FraudConfigService fraudConfigService;

    public ConfigController(
            FraudConfigService fraudConfigService
    ) {
        this.fraudConfigService = fraudConfigService;
    }

    @GetMapping("/thresholds")
    public ResponseEntity<ThresholdsResponse> getThresholds() {
        return ResponseEntity.ok(
                fraudConfigService.getThresholds()
        );
    }
}
