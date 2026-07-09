package com.amanguard.backend.feature.auth.repository;

import com.amanguard.backend.feature.auth.model.TokenBlacklist;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;

public interface TokenBlacklistRepository
        extends JpaRepository<TokenBlacklist, Long> {

    boolean existsByJwtId(String jwtId);

    void deleteByExpiresAtBefore(Instant now);
}