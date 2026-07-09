package com.amanguard.backend.feature.auth.service;

import com.amanguard.backend.feature.auth.model.UserRole;

import java.time.Instant;

public record JwtClaims(
        String subject,
        UserRole role,
        String tokenType,
        String jwtId,
        Instant issuedAt,
        Instant expiresAt
) {
}