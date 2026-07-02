package com.amanguard.backend.feature.account.repository;

import com.amanguard.backend.feature.account.model.Account;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface AccountRepository
        extends JpaRepository<Account, Long> {

    Optional<Account> findFirstByOrderByIdAsc();
}
