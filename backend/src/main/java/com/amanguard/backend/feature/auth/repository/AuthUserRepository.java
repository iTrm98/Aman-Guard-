package com.amanguard.backend.feature.auth.repository;

import com.amanguard.backend.feature.auth.model.AuthUser;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface AuthUserRepository
        extends JpaRepository<AuthUser, Long> {

    Optional<AuthUser> findByNationalId(String nationalId);

    Optional<AuthUser> findByAccountNumber(String accountNumber);

    Optional<AuthUser> findByNationalIdOrAccountNumber(
            String nationalId,
            String accountNumber
    );

    boolean existsByNationalId(String nationalId);
}