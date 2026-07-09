package com.amanguard.backend.feature.auth.service;

import com.amanguard.backend.feature.auth.model.AuthUser;

public interface JwtService {

    String generateAccessToken(AuthUser user);

    String generateRefreshToken(AuthUser user);

    JwtClaims parseAndValidate(String token);

    long getAccessTokenSeconds();
}