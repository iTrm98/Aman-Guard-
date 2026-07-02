package com.amanguard.backend.feature.fraudanalysis.repository;

import com.amanguard.backend.feature.fraudanalysis.model.FraudCase;
import com.amanguard.backend.feature.fraudanalysis.model.RiskLevel;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.Collection;

public interface FraudCaseRepository extends JpaRepository<FraudCase, Long> {

    long countByRiskLevelInAndCreatedAtGreaterThanEqual(
            Collection<RiskLevel> riskLevels,
            LocalDateTime createdAt
    );

    long countByRiskLevelInAndCreatedAtGreaterThanEqualAndCreatedAtLessThan(
            Collection<RiskLevel> riskLevels,
            LocalDateTime createdAtFrom,
            LocalDateTime createdAtTo
    );

    long countByCreatedAtGreaterThanEqual(LocalDateTime createdAt);
}
