package com.amanguard.backend.feature.callverification.config;

import com.amanguard.backend.feature.callverification.model.BankCall;
import com.amanguard.backend.feature.callverification.repository.BankCallRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class CallVerificationDataInitializer {

    @Bean
    public CommandLineRunner initializeBankCalls(
            BankCallRepository bankCallRepository
    ) {
        return args -> {
            if (bankCallRepository.count() > 0) {
                return;
            }

            BankCall officialCall = new BankCall(
                    "920000001",
                    "البنك",
                    true,
                    true
            );

            BankCall suspiciousCall = new BankCall(
                    "0551234567",
                    "جهة غير معروفة",
                    false,
                    true
            );

            bankCallRepository.save(officialCall);
            bankCallRepository.save(suspiciousCall);
        };
    }
}