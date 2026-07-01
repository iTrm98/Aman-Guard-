package com.amanguard.backend.feature.fraudanalysis.model;

import jakarta.persistence.*;

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

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
}