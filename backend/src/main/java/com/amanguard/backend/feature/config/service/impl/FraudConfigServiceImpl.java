package com.amanguard.backend.feature.config.service.impl;

import com.amanguard.backend.feature.config.dto.response.ThresholdsResponse;
import com.amanguard.backend.feature.config.service.FraudConfigService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;

@Service
public class FraudConfigServiceImpl
        implements FraudConfigService {

    @Value("${amanguard.fraud.max-purchase-amount:5000}")
    private BigDecimal maxPurchaseAmount;

    @Value("${amanguard.fraud.currency:SAR}")
    private String currency;

    @Override
    public ThresholdsResponse getThresholds() {
        return new ThresholdsResponse(
                maxPurchaseAmount,
                currency
        );
    }
}
