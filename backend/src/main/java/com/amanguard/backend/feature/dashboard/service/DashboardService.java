package com.amanguard.backend.feature.dashboard.service;

import com.amanguard.backend.feature.dashboard.dto.response.DashboardResponse;

public interface DashboardService {

    DashboardResponse getActiveCases();
}