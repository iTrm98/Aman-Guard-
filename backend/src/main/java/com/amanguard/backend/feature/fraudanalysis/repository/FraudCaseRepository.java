package com.amanguard.backend.feature.fraudanalysis.repository;

import com.amanguard.backend.feature.fraudanalysis.model.FraudCase;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FraudCaseRepository extends JpaRepository<FraudCase, Long> {
}