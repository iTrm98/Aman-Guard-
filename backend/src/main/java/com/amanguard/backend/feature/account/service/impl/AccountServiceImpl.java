package com.amanguard.backend.feature.account.service.impl;

import com.amanguard.backend.common.exception.ResourceNotFoundException;
import com.amanguard.backend.feature.account.dto.response.AccountInfoResponse;
import com.amanguard.backend.feature.account.dto.response.AccountStatsResponse;
import com.amanguard.backend.feature.account.model.Account;
import com.amanguard.backend.feature.account.repository.AccountRepository;
import com.amanguard.backend.feature.account.service.AccountService;
import com.amanguard.backend.feature.emergencyfreeze.model.FreezeStatus;
import com.amanguard.backend.feature.emergencyfreeze.repository.FreezeRequestRepository;
import com.amanguard.backend.feature.fraudanalysis.repository.FraudCaseRepository;
import com.amanguard.backend.feature.transactionanalysis.repository.TransactionAnalysisRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Service
public class AccountServiceImpl implements AccountService {

    private final AccountRepository accountRepository;
    private final FraudCaseRepository fraudCaseRepository;
    private final TransactionAnalysisRepository transactionAnalysisRepository;
    private final FreezeRequestRepository freezeRequestRepository;

    public AccountServiceImpl(
            AccountRepository accountRepository,
            FraudCaseRepository fraudCaseRepository,
            TransactionAnalysisRepository transactionAnalysisRepository,
            FreezeRequestRepository freezeRequestRepository
    ) {
        this.accountRepository = accountRepository;
        this.fraudCaseRepository = fraudCaseRepository;
        this.transactionAnalysisRepository = transactionAnalysisRepository;
        this.freezeRequestRepository = freezeRequestRepository;
    }

    @Override
    public AccountInfoResponse getCurrentAccount() {
        Account account = accountRepository
                .findFirstByOrderByIdAsc()
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "لا يوجد حساب متاح."
                        )
                );

        return new AccountInfoResponse(
                account.getIban(),
                account.getMaskedIban(),
                account.getBalance(),
                account.getCurrency(),
                account.getStatus(),
                account.getSecurityStatus(),
                createStats()
        );
    }

    // There is no standalone transactions table (single-account demo), so
    // these are derived from the real activity tables that do exist:
    // fraud analyses, transaction analyses, and approved freeze requests.
    private AccountStatsResponse createStats() {
        LocalDateTime todayStart = LocalDate.now().atStartOfDay();
        LocalDateTime thirtyDaysAgo = LocalDateTime.now().minusDays(30);

        long opsToday =
                fraudCaseRepository
                        .countByCreatedAtGreaterThanEqual(todayStart)
                        + transactionAnalysisRepository
                        .countByCreatedAtGreaterThanEqual(todayStart);

        long securityChecks = fraudCaseRepository
                .countByCreatedAtGreaterThanEqual(thirtyDaysAgo);

        long threatsStopped = freezeRequestRepository
                .countByStatus(FreezeStatus.APPROVED);

        return new AccountStatsResponse(
                (int) opsToday,
                (int) securityChecks,
                (int) threatsStopped
        );
    }
}
