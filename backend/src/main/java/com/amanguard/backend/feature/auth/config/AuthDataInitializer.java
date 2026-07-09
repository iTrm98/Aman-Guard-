package com.amanguard.backend.feature.auth.config;

import com.amanguard.backend.feature.auth.model.AuthUser;
import com.amanguard.backend.feature.auth.model.UserRole;
import com.amanguard.backend.feature.auth.repository.AuthUserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
public class AuthDataInitializer {

    @Bean
    public CommandLineRunner initializeAuthUsers(
            AuthUserRepository authUserRepository,
            PasswordEncoder passwordEncoder
    ) {
        return args -> {
            if (authUserRepository.count() > 0) {
                return;
            }

            authUserRepository.save(new AuthUser(
                    "3030303030",
                    "SA0000000000000000004821",
                    "0555556666",
                    "نواف العتيبي",
                    UserRole.CUSTOMER,
                    passwordEncoder.encode("1234")
            ));

            authUserRepository.save(new AuthUser(
                    "9999999999",
                    "OFFICER-001",
                    "0500000000",
                    "SOC Officer",
                    UserRole.BANK_OFFICER,
                    passwordEncoder.encode("1234")
            ));
        };
    }
}