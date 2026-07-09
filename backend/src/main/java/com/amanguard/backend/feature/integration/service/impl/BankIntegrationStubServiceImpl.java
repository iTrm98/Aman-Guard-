package com.amanguard.backend.feature.integration.service.impl;

import com.amanguard.backend.feature.integration.dto.*;
import com.amanguard.backend.feature.integration.service.BankIntegrationStubService;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@Service
public class BankIntegrationStubServiceImpl
        implements BankIntegrationStubService {

    private static final String OPEN_BANKING_PROVIDER =
            "SAMA_OPEN_BANKING_STUB";

    private static final String SMS_PROVIDER =
            "SMS_GATEWAY_STUB";

    private static final String TELEPHONY_PROVIDER =
            "TELEPHONY_PROVIDER_STUB";

    private static final String MERCHANT_PROVIDER =
            "MERCHANT_REGISTRY_STUB";

    private static final String TODO_MESSAGE =
            "TODO: replace with real provider integration before production.";

    private static final Set<String> REGISTERED_BANK_NUMBERS = Set.of(
            "8000000000",
            "920000000",
            "+966800000000"
    );

    private static final Set<String> TRUSTED_INSTITUTIONS = Set.of(
            "amanguard demo bank",
            "demo bank",
            "bank",
            "البنك",
            "بنك"
    );

    private static final Map<String, String> VERIFIED_MERCHANTS = Map.of(
            "1010000001", "AmanGuard Demo Store",
            "1010000002", "Saudi Demo Telecom",
            "4030000001", "Makkah Demo Market",
            "7000000001", "Verified Government Service"
    );

    @Override
    public OpenBankingAccountSummaryResponse getAccountSummary(
            String accountNumber
    ) {
        BigDecimal currentBalance = createDemoBalance(
                accountNumber
        );

        BigDecimal availableBalance = currentBalance.subtract(
                new BigDecimal("250.00")
        );

        // TODO: replace with SAMA Open Banking account summary API.
        return new OpenBankingAccountSummaryResponse(
                OPEN_BANKING_PROVIDER,
                accountNumber,
                maskAccountNumber(accountNumber),
                availableBalance,
                currentBalance,
                "SAR",
                "ACTIVE",
                LocalDateTime.now(),
                TODO_MESSAGE
        );
    }

    @Override
    public List<OpenBankingTransactionResponse> getTransactionHistory(
            String accountNumber
    ) {
        LocalDateTime now = LocalDateTime.now();

        // TODO: replace with SAMA Open Banking transaction history API.
        return List.of(
                new OpenBankingTransactionResponse(
                        "TXN-" + shortId(),
                        accountNumber,
                        new BigDecimal("12500.00"),
                        "SAR",
                        "OUT",
                        "Unknown Beneficiary",
                        "TRANSFER",
                        "MOBILE_APP",
                        now.minusMinutes(18),
                        "FLAGGED"
                ),
                new OpenBankingTransactionResponse(
                        "TXN-" + shortId(),
                        accountNumber,
                        new BigDecimal("239.50"),
                        "SAR",
                        "OUT",
                        "AmanGuard Demo Store",
                        "PURCHASE",
                        "POS",
                        now.minusHours(4),
                        "SETTLED"
                ),
                new OpenBankingTransactionResponse(
                        "TXN-" + shortId(),
                        accountNumber,
                        new BigDecimal("4800.00"),
                        "SAR",
                        "IN",
                        "Payroll",
                        "SALARY",
                        "BANK_TRANSFER",
                        now.minusDays(2),
                        "SETTLED"
                )
        );
    }

    @Override
    public SmsSendResponse sendSms(
            SmsSendRequest request
    ) {
        // TODO: replace with real SMS gateway provider.
        return new SmsSendResponse(
                SMS_PROVIDER,
                "SMS-" + shortId(),
                request.phoneNumber(),
                "SENT",
                normalizePurpose(request.purpose()),
                LocalDateTime.now(),
                TODO_MESSAGE
        );
    }

    @Override
    public TelephonyVerificationResponse verifyCaller(
            TelephonyVerificationRequest request
    ) {
        String normalizedCaller =
                normalizePhone(request.callerNumber());

        String normalizedInstitution =
                normalizeText(request.claimedInstitution());

        boolean registeredNumber =
                REGISTERED_BANK_NUMBERS.contains(
                        normalizedCaller
                );

        boolean trustedInstitution =
                TRUSTED_INSTITUTIONS.contains(
                        normalizedInstitution
                );

        String riskLevel;
        String recommendation;

        if (registeredNumber && trustedInstitution) {
            riskLevel = "LOW";
            recommendation =
                    "المكالمة تبدو من رقم مسجل، لكن لا تطلب رموز تحقق من العميل.";
        } else if (trustedInstitution) {
            riskLevel = "HIGH";
            recommendation =
                    "الجهة المدعاة بنكية لكن الرقم غير مسجل. لا تشارك أي رمز تحقق.";
        } else {
            riskLevel = "CRITICAL";
            recommendation =
                    "المكالمة غير موثوقة. يوصى بإنهاء الاتصال ورفع بلاغ.";
        }

        // TODO: replace with real telephony provider / registered bank numbers.
        return new TelephonyVerificationResponse(
                TELEPHONY_PROVIDER,
                request.callerNumber(),
                request.claimedInstitution(),
                registeredNumber,
                trustedInstitution,
                riskLevel,
                recommendation,
                LocalDateTime.now(),
                TODO_MESSAGE
        );
    }

    @Override
    public MerchantRegistryResponse verifyMerchantByCrNumber(
            String crNumber
    ) {
        String merchantName =
                VERIFIED_MERCHANTS.get(crNumber);

        boolean verified = merchantName != null;

        String riskLevel = verified ? "LOW" : "MEDIUM";

        String recommendation = verified
                ? "التاجر موجود في سجل التجار التجريبي الموثوق."
                : "لم يتم العثور على السجل التجاري في بيانات التجربة. يحتاج تحقق يدوي.";

        // TODO: replace with official merchant registry / CR lookup provider.
        return new MerchantRegistryResponse(
                MERCHANT_PROVIDER,
                crNumber,
                verified ? merchantName : "UNKNOWN_MERCHANT",
                verified,
                verified ? "ACTIVE" : "NOT_FOUND",
                riskLevel,
                recommendation,
                LocalDateTime.now(),
                TODO_MESSAGE
        );
    }

    private BigDecimal createDemoBalance(
            String accountNumber
    ) {
        int hash = Math.abs(
                accountNumber == null
                        ? 0
                        : accountNumber.hashCode()
        );

        int amount = 10_000 + hash % 90_000;

        return new BigDecimal(amount + ".50");
    }

    private String maskAccountNumber(
            String accountNumber
    ) {
        if (accountNumber == null || accountNumber.length() <= 4) {
            return "****";
        }

        String last4 = accountNumber.substring(
                accountNumber.length() - 4
        );

        return "**** **** **** " + last4;
    }

    private String normalizePurpose(
            String purpose
    ) {
        if (purpose == null || purpose.isBlank()) {
            return "GENERAL";
        }

        return purpose
                .trim()
                .toUpperCase(Locale.ROOT);
    }

    private String normalizePhone(
            String phone
    ) {
        if (phone == null) {
            return "";
        }

        return phone
                .replace(" ", "")
                .replace("-", "")
                .trim();
    }

    private String normalizeText(
            String text
    ) {
        if (text == null) {
            return "";
        }

        return text
                .toLowerCase(Locale.ROOT)
                .trim();
    }

    private String shortId() {
        return UUID
                .randomUUID()
                .toString()
                .substring(0, 8)
                .toUpperCase(Locale.ROOT);
    }
}