package com.amanguard.backend.feature.auth.controller;

import com.amanguard.backend.feature.auth.dto.request.LoginRequest;
import com.amanguard.backend.feature.auth.dto.request.OtpRequest;
import com.amanguard.backend.feature.auth.dto.request.RefreshTokenRequest;
import com.amanguard.backend.feature.auth.dto.response.LoginResponse;
import com.amanguard.backend.feature.auth.dto.response.LogoutResponse;
import com.amanguard.backend.feature.auth.dto.response.OtpResponse;
import com.amanguard.backend.feature.auth.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(
            AuthService authService
    ) {
        this.authService = authService;
    }

    @PostMapping("/otp")
    public ResponseEntity<OtpResponse> requestOtp(
            @Valid @RequestBody OtpRequest request
    ) {
        return ResponseEntity.ok(
                authService.requestOtp(request)
        );
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(
            @Valid @RequestBody LoginRequest request
    ) {
        return ResponseEntity.ok(
                authService.login(request)
        );
    }

    @PostMapping("/refresh")
    public ResponseEntity<LoginResponse> refresh(
            @Valid @RequestBody RefreshTokenRequest request
    ) {
        return ResponseEntity.ok(
                authService.refresh(request)
        );
    }

    @PostMapping("/logout")
    public ResponseEntity<LogoutResponse> logout(
            @RequestHeader(value = "Authorization", required = false)
            String authorizationHeader
    ) {
        return ResponseEntity.ok(
                authService.logout(authorizationHeader)
        );
    }
}