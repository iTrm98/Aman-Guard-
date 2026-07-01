package com.amanguard.backend.feature.dashboard.dto.response;

public record DashboardStatsResponse(
        long criticalToday,
        long suspectedCases,
        long accountsFrozen,
        String amountSaved
) {
}