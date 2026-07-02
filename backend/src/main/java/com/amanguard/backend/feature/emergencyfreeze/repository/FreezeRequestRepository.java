package com.amanguard.backend.feature.emergencyfreeze.repository;

import com.amanguard.backend.feature.emergencyfreeze.model.FreezeRequest;
import com.amanguard.backend.feature.emergencyfreeze.model.FreezeStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.Optional;

public interface FreezeRequestRepository
        extends JpaRepository<FreezeRequest, Long> {

    Optional<FreezeRequest>
    findFirstByFraudCaseIdOrderByCreatedAtDesc(
            Long fraudCaseId
    );

    Optional<FreezeRequest>
    findFirstByFraudCaseIdAndStatusOrderByCreatedAtDesc(
            Long fraudCaseId,
            FreezeStatus status
    );

    long countByStatus(FreezeStatus status);

    long countByStatusAndUpdatedAtGreaterThanEqual(
            FreezeStatus status,
            LocalDateTime updatedAt
    );

    long countByStatusAndUpdatedAtGreaterThanEqualAndUpdatedAtLessThan(
            FreezeStatus status,
            LocalDateTime updatedAtFrom,
            LocalDateTime updatedAtTo
    );
}