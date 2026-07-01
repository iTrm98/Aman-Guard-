package com.amanguard.backend.feature.callverification.repository;

import com.amanguard.backend.feature.callverification.model.BankCall;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface BankCallRepository
        extends JpaRepository<BankCall, Long> {

    Optional<BankCall>
    findFirstByCallerNumberAndActiveTrueOrderByStartedAtDesc(
            String callerNumber
    );
}