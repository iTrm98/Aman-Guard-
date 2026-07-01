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

    @Column(
            name = "fraud_case_id",
            nullable = false
    )
    private Long fraudCaseId;

    @Column(
            nullable = false,
            precision = 15,
            scale = 2
    )
    private BigDecimal amount;

    @Column(
            name = "new_beneficiary",
            nullable = false
    )
    private boolean newBeneficiary;

    @Column(
            name = "caller_requested_transfer",
            nullable = false
    )
    private boolean callerRequestedTransfer;

    @Column(
            name = "otp_requested",
            nullable = false
    )
    private boolean otpRequested;

    @Column(
            name = "urgent_request",
            nullable = false
    )
    private boolean urgentRequest;

    @Column(
            name = "unusual_time",
            nullable = false
    )
    private boolean unusualTime;

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

    @Column(
            nullable = false,
            length = 1000
    )
    private String recommendation;

    @Column(
            name = "created_at",
            nullable = false
    )
    private LocalDateTime createdAt;

    public TransactionAnalysis() {
    }

    public TransactionAnalysis(
            Long fraudCaseId,
            BigDecimal amount,
            boolean newBeneficiary,
            boolean callerRequestedTransfer,
            boolean otpRequested,
            boolean urgentRequest,
            boolean unusualTime,
            int riskScore,
            RiskLevel riskLevel,
            String recommendation
    ) {
        this.fraudCaseId = fraudCaseId;
        this.amount = amount;
        this.newBeneficiary = newBeneficiary;
        this.callerRequestedTransfer = callerRequestedTransfer;
        this.otpRequested = otpRequested;
        this.urgentRequest = urgentRequest;
        this.unusualTime = unusualTime;
        this.riskScore = riskScore;
        this.riskLevel = riskLevel;
        this.recommendation = recommendation;
    }

    @PrePersist
    public void beforeSave() {
        createdAt = LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public Long getFraudCaseId() {
        return fraudCaseId;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public boolean isNewBeneficiary() {
        return newBeneficiary;
    }

    public boolean isCallerRequestedTransfer() {
        return callerRequestedTransfer;
    }

    public boolean isOtpRequested() {
        return otpRequested;
    }

    public boolean isUrgentRequest() {
        return urgentRequest;
    }

    public boolean isUnusualTime() {
        return unusualTime;
    }

    public int getRiskScore() {
        return riskScore;
    }

    public RiskLevel getRiskLevel() {
        return riskLevel;
    }

    public String getRecommendation() {
        return recommendation;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
}