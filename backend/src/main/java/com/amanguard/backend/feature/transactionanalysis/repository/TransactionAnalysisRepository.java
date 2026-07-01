package com.amanguard.backend.feature.transactionanalysis.repository;

import com.amanguard.backend.feature.transactionanalysis.model.TransactionAnalysis;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TransactionAnalysisRepository
        extends JpaRepository<TransactionAnalysis, Long> {
}