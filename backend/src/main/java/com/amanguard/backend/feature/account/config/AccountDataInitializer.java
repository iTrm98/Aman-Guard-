package com.amanguard.backend.feature.account.config;

import com.amanguard.backend.feature.account.model.Account;
import com.amanguard.backend.feature.account.repository.AccountRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.math.BigDecimal;

@Configuration
public class AccountDataInitializer {

    @Bean
    public CommandLineRunner initializeAccount(
            AccountRepository accountRepository
    ) {
        return args -> {
            if (accountRepository.count() > 0) {
                return;
            }

            Account account = new Account(
                    "SA0000000000000000004821",
                    "SA•• •••• •••• •••• 4821",
                    new BigDecimal("48321.50"),
                    "SAR",
                    "active",
                    "protected"
            );

            accountRepository.save(account);
        };
    }
}
