package com.amanguard.backend.feature.account.dto.response;

public record AccountStatsResponse(
        int opsToday,
        int securityChecks,
        int threatsStopped
) {
}
