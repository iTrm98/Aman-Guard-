package com.amanguard.backend.feature.analytics.service;

import com.amanguard.backend.feature.analytics.dto.AmountSavedPointResponse;
import com.amanguard.backend.feature.analytics.dto.FraudTrendPointResponse;
import com.amanguard.backend.feature.analytics.dto.RiskBreakdownResponse;
import com.amanguard.backend.feature.analytics.dto.TopFraudPatternResponse;

import java.util.List;

public interface AnalyticsService {

    List<FraudTrendPointResponse> getFraudTrend(int days);

    List<RiskBreakdownResponse> getRiskBreakdown();

    List<TopFraudPatternResponse> getTopFraudPatterns(int limit);

    List<AmountSavedPointResponse> getAmountSavedTrend(int days);
}