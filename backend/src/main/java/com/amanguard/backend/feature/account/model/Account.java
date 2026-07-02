package com.amanguard.backend.feature.account.model;

import jakarta.persistence.*;

import java.math.BigDecimal;

@Entity
@Table(name = "accounts")
public class Account {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 34)
    private String iban;

    @Column(name = "masked_iban", nullable = false, length = 40)
    private String maskedIban;

    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal balance;

    @Column(nullable = false, length = 3)
    private String currency;

    @Column(nullable = false, length = 30)
    private String status;

    @Column(name = "security_status", nullable = false, length = 30)
    private String securityStatus;

    public Account() {
    }

    public Account(
            String iban,
            String maskedIban,
            BigDecimal balance,
            String currency,
            String status,
            String securityStatus
    ) {
        this.iban = iban;
        this.maskedIban = maskedIban;
        this.balance = balance;
        this.currency = currency;
        this.status = status;
        this.securityStatus = securityStatus;
    }

    public Long getId() {
        return id;
    }

    public String getIban() {
        return iban;
    }

    public String getMaskedIban() {
        return maskedIban;
    }

    public BigDecimal getBalance() {
        return balance;
    }

    public String getCurrency() {
        return currency;
    }

    public String getStatus() {
        return status;
    }

    public String getSecurityStatus() {
        return securityStatus;
    }
}
