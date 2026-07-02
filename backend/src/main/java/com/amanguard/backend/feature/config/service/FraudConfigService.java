package com.amanguard.backend.feature.config.service;

import com.amanguard.backend.feature.config.dto.response.ThresholdsResponse;

public interface FraudConfigService {

    ThresholdsResponse getThresholds();
}
