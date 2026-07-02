package com.amanguard.backend.feature.fraudanalysis.model;

import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "fraud_cases")
public class FraudCase {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(
            name = "input_text",
            nullable = false,
            length = 5000
    )
    private String inputText;

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

    // The fields below are optional, officer-entered data (manual case entry
    // or SOC edits). When null, display values are derived on the fly in
    // DashboardServiceImpl (demo name hash / keyword pattern detection).
    @Column(name = "customer_name", length = 100)
    private String customerName;

    @Column(name = "fraud_pattern", length = 200)
    private String fraudPattern;

    @Column(name = "account_number", length = 34)
    private String accountNumber;

    @Column(length = 20)
    private String phone;

    @Column(length = 2000)
    private String notes;

    // Explicit officer override of the derived account status
    // ("active" | "partially_restricted" | "frozen"). Wins over the
    // freeze-request-derived status when set.
    @Column(name = "account_status_override", length = 30)
    private String accountStatusOverride;

    @Column(
            name = "estimated_amount",
            precision = 15,
            scale = 2
    )
    private BigDecimal estimatedAmount;

    @Column(
            name = "created_at",
            nullable = false
    )
    private LocalDateTime createdAt;

    public FraudCase() {
    }

    public FraudCase(
            String inputText,
            int riskScore,
            RiskLevel riskLevel,
            String recommendation
    ) {
        this.inputText = inputText;
        this.riskScore = riskScore;
        this.riskLevel = riskLevel;
        this.recommendation = recommendation;
    }

    @PrePersist
    public void beforeSave() {
        createdAt = LocalDateTime.now();
    }

    public void updateRiskAssessment(
            int riskScore,
            RiskLevel riskLevel,
            String recommendation
    ) {
        this.riskScore = riskScore;
        this.riskLevel = riskLevel;
        this.recommendation = recommendation;
    }

    public void setCustomerName(String customerName) {
        this.customerName = customerName;
    }

    public void setFraudPattern(String fraudPattern) {
        this.fraudPattern = fraudPattern;
    }

    public void setAccountNumber(String accountNumber) {
        this.accountNumber = accountNumber;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public void setAccountStatusOverride(String accountStatusOverride) {
        this.accountStatusOverride = accountStatusOverride;
    }

    public void setEstimatedAmount(BigDecimal estimatedAmount) {
        this.estimatedAmount = estimatedAmount;
    }

    public Long getId() {
        return id;
    }

    public String getInputText() {
        return inputText;
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

    public String getCustomerName() {
        return customerName;
    }

    public String getFraudPattern() {
        return fraudPattern;
    }

    public String getAccountNumber() {
        return accountNumber;
    }

    public String getPhone() {
        return phone;
    }

    public String getNotes() {
        return notes;
    }

    public String getAccountStatusOverride() {
        return accountStatusOverride;
    }

    public BigDecimal getEstimatedAmount() {
        return estimatedAmount;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
}
