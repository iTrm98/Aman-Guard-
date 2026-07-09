package com.amanguard.backend.feature.integration.controller;

import com.amanguard.backend.feature.integration.dto.*;
import com.amanguard.backend.feature.integration.service.BankIntegrationStubService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
public class BankIntegrationStubController {

    private final BankIntegrationStubService integrationService;

    public BankIntegrationStubController(
            BankIntegrationStubService integrationService
    ) {
        this.integrationService = integrationService;
    }

    @GetMapping("/api/open-banking/accounts/{accountNumber}/summary")
    public ResponseEntity<OpenBankingAccountSummaryResponse> getAccountSummary(
            @PathVariable String accountNumber
    ) {
        return ResponseEntity.ok(
                integrationService.getAccountSummary(accountNumber)
        );
    }

    @GetMapping("/api/open-banking/accounts/{accountNumber}/transactions")
    public ResponseEntity<List<OpenBankingTransactionResponse>> getTransactions(
            @PathVariable String accountNumber
    ) {
        return ResponseEntity.ok(
                integrationService.getTransactionHistory(accountNumber)
        );
    }

    @PostMapping("/api/sms/send")
    public ResponseEntity<SmsSendResponse> sendSms(
            @Valid @RequestBody SmsSendRequest request
    ) {
        return ResponseEntity.ok(
                integrationService.sendSms(request)
        );
    }

    @PostMapping("/api/telephony/verify-call")
    public ResponseEntity<TelephonyVerificationResponse> verifyCall(
            @Valid @RequestBody TelephonyVerificationRequest request
    ) {
        return ResponseEntity.ok(
                integrationService.verifyCaller(request)
        );
    }

    @GetMapping("/api/merchant-registry/{crNumber}")
    public ResponseEntity<MerchantRegistryResponse> verifyMerchant(
            @PathVariable String crNumber
    ) {
        return ResponseEntity.ok(
                integrationService.verifyMerchantByCrNumber(crNumber)
        );
    }
}