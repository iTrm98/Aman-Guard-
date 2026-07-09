package com.amanguard.backend.feature.emergencyfreeze.service;

import com.amanguard.backend.feature.emergencyfreeze.dto.response.FreezeAccountResponse;
import com.amanguard.backend.feature.emergencyfreeze.dto.response.FreezeRequestStatusResponse;

public interface EmergencyFreezeService {

    FreezeAccountResponse requestFreeze(
            Long caseId,
            String reason
    );

    FreezeRequestStatusResponse getRequestStatus(
            Long requestId
    );

    FreezeRequestStatusResponse approveRequest(
            Long requestId
    );

    FreezeRequestStatusResponse rejectRequest(
            Long requestId
    );

    FreezeRequestStatusResponse unfreezeRequest(
            Long requestId
    );
}