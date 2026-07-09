package com.amanguard.backend.feature.auth.dto.response;

public record LoginResponse(
        String accessToken,
        String refreshToken,
        String tokenType,
        long expiresInSeconds,
        String role,
        String nationalId,
        String accountNumber,
        String displayName
) {
}