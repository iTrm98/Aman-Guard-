package com.amanguard.backend.feature.callverification.service;

import com.amanguard.backend.feature.callverification.dto.response.CallStatusResponse;

public interface CallVerificationService {

    CallStatusResponse verifyCall();
}