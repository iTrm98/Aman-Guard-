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

    // Idempotent demo seed: guarantees the two hackathon login accounts exist on
    // every startup regardless of DB state. Passwords are hashed with the same
    // PasswordEncoder used at login (no plaintext, no BCrypt in SQL migrations).
    //   Customer     — national id 1234567890 / password Password123!
    //   Bank officer — national id 0987654321 / password Password123!
    @Bean
    public CommandLineRunner initializeAuthUsers(
            AuthUserRepository authUserRepository,
            PasswordEncoder passwordEncoder
    ) {
        return args -> {
            ensureUser(
                    authUserRepository, passwordEncoder,
                    "1234567890", "SA0000000000000000001234", "0555000001",
                    "نواف العتيبي", "Nawaf Al-Otaibi",
                    UserRole.CUSTOMER, "Password123!"
            );

            ensureUser(
                    authUserRepository, passwordEncoder,
                    "0987654321", "OFFICER-042", "0555000002",
                    "ريم القحطاني", "Reem Al-Qahtani",
                    UserRole.BANK_OFFICER, "Password123!"
            );
        };
    }

    private void ensureUser(
            AuthUserRepository authUserRepository,
            PasswordEncoder passwordEncoder,
            String nationalId,
            String accountNumber,
            String phone,
            String displayName,
            String displayNameEn,
            UserRole role,
            String rawPassword
    ) {
        if (authUserRepository.existsByNationalId(nationalId)) {
            return;
        }

        authUserRepository.save(new AuthUser(
                nationalId,
                accountNumber,
                phone,
                displayName,
                displayNameEn,
                role,
                passwordEncoder.encode(rawPassword)
        ));
    }
}
