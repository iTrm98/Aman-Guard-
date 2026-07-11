package com.amanguard.backend.feature.auth.dto.response;

public record LoginResponse(
        String token,
        String refreshToken,
        String role,
        Long userId,
        String name,
        String nameEn
) {
}
