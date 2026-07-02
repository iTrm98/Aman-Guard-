package com.amanguard.backend.feature.dashboard.config;

import com.amanguard.backend.feature.emergencyfreeze.model.FreezeRequest;
import com.amanguard.backend.feature.emergencyfreeze.model.FreezeStatus;
import com.amanguard.backend.feature.emergencyfreeze.repository.FreezeRequestRepository;
import com.amanguard.backend.feature.fraudanalysis.model.FraudCase;
import com.amanguard.backend.feature.fraudanalysis.model.RiskLevel;
import com.amanguard.backend.feature.fraudanalysis.repository.FraudCaseRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.math.BigDecimal;

@Configuration
public class DashboardDataInitializer {

    @Bean
    public CommandLineRunner initializeDashboardData(
            FraudCaseRepository fraudCaseRepository,
            FreezeRequestRepository freezeRequestRepository
    ) {
        return args -> {
            if (fraudCaseRepository.count() > 0) {
                return;
            }

            FraudCase shippingCase = new FraudCase(
                    "لديك شحنة متوقفة. ادفع رسوم التوصيل الآن من خلال الرابط.",
                    82,
                    RiskLevel.HIGH,
                    "لا تفتح الرابط وتحقق من شركة التوصيل عبر قنواتها الرسمية."
            );

            shippingCase.setEstimatedAmount(new BigDecimal("7500"));

            fraudCaseRepository.save(shippingCase);

            FraudCase otpCase = new FraudCase(
                    "نحن من البنك. أرسل رمز OTP فوراً حتى لا يتم إيقاف حسابك.",
                    95,
                    RiskLevel.CRITICAL,
                    "أوقف التواصل فوراً ولا تشارك رمز التحقق."
            );

            otpCase.setEstimatedAmount(new BigDecimal("12500"));

            FraudCase savedOtpCase =
                    fraudCaseRepository.save(otpCase);

            FreezeRequest freezeRequest = new FreezeRequest(
                    savedOtpCase.getId(),
                    "demo_case",
                    FreezeStatus.APPROVED,
                    "FR-9020"
            );

            freezeRequestRepository.save(freezeRequest);
        };
    }
}