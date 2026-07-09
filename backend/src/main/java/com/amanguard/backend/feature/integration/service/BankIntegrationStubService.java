package com.amanguard.backend.feature.integration.service;

import com.amanguard.backend.feature.integration.dto.*;

import java.util.List;

public interface BankIntegrationStubService {

    OpenBankingAccountSummaryResponse getAccountSummary(
            String accountNumber
    );

    List<OpenBankingTransactionResponse> getTransactionHistory(
            String accountNumber
    );

    SmsSendResponse sendSms(SmsSendRequest request);

    TelephonyVerificationResponse verifyCaller(
            TelephonyVerificationRequest request
    );

    MerchantRegistryResponse verifyMerchantByCrNumber(
            String crNumber
    );
}