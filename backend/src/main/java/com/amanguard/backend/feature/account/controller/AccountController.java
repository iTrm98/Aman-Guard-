package com.amanguard.backend.feature.account.controller;

import com.amanguard.backend.feature.account.dto.response.AccountInfoResponse;
import com.amanguard.backend.feature.account.service.AccountService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/account")
public class AccountController {

    private final AccountService accountService;

    public AccountController(
            AccountService accountService
    ) {
        this.accountService = accountService;
    }

    @GetMapping("/me")
    public ResponseEntity<AccountInfoResponse> getCurrentAccount() {
        return ResponseEntity.ok(
                accountService.getCurrentAccount()
        );
    }
}
