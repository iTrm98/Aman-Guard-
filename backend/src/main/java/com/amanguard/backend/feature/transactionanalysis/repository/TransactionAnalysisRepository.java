package com.amanguard.backend.feature.transactionanalysis.repository;

import com.amanguard.backend.feature.transactionanalysis.model.TransactionAnalysis;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;

public interface TransactionAnalysisRepository
        extends JpaRepository<TransactionAnalysis, Long> {

    long countByCreatedAtGreaterThanEqual(LocalDateTime createdAt);
}