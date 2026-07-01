package com.amanguard.backend.feature.dashboard.dto.response;

import java.util.List;

public record DashboardResponse(
        DashboardStatsResponse stats,
        List<ActiveCaseResponse> cases
) {
}