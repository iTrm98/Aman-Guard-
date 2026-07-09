package com.amanguard.backend.feature.auth.service;

import com.amanguard.backend.feature.auth.dto.request.LoginRequest;
import com.amanguard.backend.feature.auth.dto.request.OtpRequest;
import com.amanguard.backend.feature.auth.dto.request.RefreshTokenRequest;
import com.amanguard.backend.feature.auth.dto.response.LoginResponse;
import com.amanguard.backend.feature.auth.dto.response.LogoutResponse;
import com.amanguard.backend.feature.auth.dto.response.OtpResponse;

public interface AuthService {

    OtpResponse requestOtp(OtpRequest request);

    LoginResponse login(LoginRequest request);

    LoginResponse refresh(RefreshTokenRequest request);

    LogoutResponse logout(String authorizationHeader);
}