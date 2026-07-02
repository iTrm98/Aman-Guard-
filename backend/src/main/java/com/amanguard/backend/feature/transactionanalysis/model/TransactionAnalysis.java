package com.amanguard.backend.feature.transactionanalysis.model;

import com.amanguard.backend.feature.fraudanalysis.model.RiskLevel;
import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "transaction_analyses")
public class TransactionAnalysis {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Set only when the analysis produced a fraud case (blocked purchases,
    // or a customer stopping a suspended purchase).
    @Column(name = "fraud_case_id")
    private Long fraudCaseId;

    @Column(
            name = "merchant_name",
            nullable = false,
            length = 200
    )
    private String merchantName;

    @Column(
            nullable = false,
            precision = 15,
            scale = 2
    )
    private BigDecimal amount;

    @Column(length = 10)
    private String currency;

    @Column(name = "merchant_url", length = 500)
    private String merchantUrl;

    @Column(name = "transaction_type", length = 50)
    private String transactionType;

    @Column(
            name = "risk_score",
            nullable = false
    )
    private int riskScore;

    @Enumerated(EnumType.STRING)
    @Column(
            name = "risk_level",
            nullable = false
    )
    private RiskLevel riskLevel;

    // "allowed" | "suspended" | "blocked"
    @Column(nullable = false, length = 20)
    private String action;

    // Customer decision on a suspended transaction:
    // null | "confirmed" | "cancelled"
    @Column(length = 20)
    private String resolution;

    @Column(name = "report_number", length = 30)
    private String reportNumber;

    @Column(
            name = "created_at",
            nullable = false
    )
    private LocalDateTime createdAt;

    public TransactionAnalysis() {
    }

    public TransactionAnalysis(
            String merchantName,
            BigDecimal amount,
            String currency,
            String merchantUrl,
            String transactionType,
            int riskScore,
            RiskLevel riskLevel,
            String action
    ) {
        this.merchantName = merchantName;
        this.amount = amount;
        this.currency = currency;
        this.merchantUrl = merchantUrl;
        this.transactionType = transactionType;
        this.riskScore = riskScore;
        this.riskLevel = riskLevel;
        this.action = action;
    }

    @PrePersist
    public void beforeSave() {
        createdAt = LocalDateTime.now();
    }

    public void attachFraudCase(
            Long fraudCaseId,
            String reportNumber
    ) {
        this.fraudCaseId = fraudCaseId;
        this.reportNumber = reportNumber;
    }

    public void confirmByCustomer() {
        resolution = "confirmed";
    }

    public void cancelByCustomer() {
        resolution = "cancelled";
    }

    public Long getId() {
        return id;
    }

    public Long getFraudCaseId() {
        return fraudCaseId;
    }

    public String getMerchantName() {
        return merchantName;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public String getCurrency() {
        return currency;
    }

    public String getMerchantUrl() {
        return merchantUrl;
    }

    public String getTransactionType() {
        return transactionType;
    }

    public int getRiskScore() {
        return riskScore;
    }

    public RiskLevel getRiskLevel() {
        return riskLevel;
    }

    public String getAction() {
        return action;
    }

    public String getResolution() {
        return resolution;
    }

    public String getReportNumber() {
        return reportNumber;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
}
