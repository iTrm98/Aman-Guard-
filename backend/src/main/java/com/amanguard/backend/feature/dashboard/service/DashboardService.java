package com.amanguard.backend.feature.dashboard.service;

import com.amanguard.backend.feature.dashboard.dto.request.CreateCaseRequest;
import com.amanguard.backend.feature.dashboard.dto.request.UpdateCaseRequest;
import com.amanguard.backend.feature.dashboard.dto.response.ActiveCaseResponse;
import com.amanguard.backend.feature.dashboard.dto.response.DashboardResponse;

public interface DashboardService {

    DashboardResponse getActiveCases();

    ActiveCaseResponse getCaseById(Long caseId);

    ActiveCaseResponse createCase(CreateCaseRequest request);

    ActiveCaseResponse updateCase(Long caseId, UpdateCaseRequest request);
}
