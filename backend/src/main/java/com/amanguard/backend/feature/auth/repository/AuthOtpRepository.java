package com.amanguard.backend.feature.auth.repository;

import com.amanguard.backend.feature.auth.model.AuthOtp;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface AuthOtpRepository
        extends JpaRepository<AuthOtp, Long> {

    Optional<AuthOtp> findTopByIdentifierAndUsedFalseOrderByCreatedAtDesc(
            String identifier
    );
}