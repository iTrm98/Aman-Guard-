package com.amanguard.backend.feature.verification.repository;

import com.amanguard.backend.feature.verification.model.VerificationSession;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface VerificationSessionRepository
        extends JpaRepository<VerificationSession, Long> {

    Optional<VerificationSession> findByFraudCaseId(
            Long fraudCaseId
    );
}