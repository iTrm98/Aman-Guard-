package com.amanguard.backend.feature.verification.model;

import com.amanguard.backend.feature.fraudanalysis.model.RiskLevel;
import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(
        name = "verification_sessions",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uk_verification_fraud_case",
                        columnNames = "fraud_case_id"
                )
        }
)
public class VerificationSession {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(
            name = "fraud_case_id",
            nullable = false,
            unique = true
    )
    private Long fraudCaseId;

    @Column(
            name = "question_one_answer",
            nullable = false
    )
    private boolean questionOneAnswer;

    @Column(
            name = "question_two_answer",
            nullable = false
    )
    private boolean questionTwoAnswer;

    @Column(
            name = "question_three_answer",
            nullable = false
    )
    private boolean questionThreeAnswer;

    @Column(
            name = "previous_risk_score",
            nullable = false
    )
    private int previousRiskScore;

    @Column(
            name = "added_risk_score",
            nullable = false
    )
    private int addedRiskScore;

    @Column(
            name = "final_risk_score",
            nullable = false
    )
    private int finalRiskScore;

    @Enumerated(EnumType.STRING)
    @Column(
            name = "risk_level",
            nullable = false
    )
    private RiskLevel riskLevel;

    @Column(
            name = "recommended_action",
            nullable = false,
            length = 50
    )
    private String recommendedAction;

    @Column(
            name = "created_at",
            nullable = false
    )
    private LocalDateTime createdAt;

    public VerificationSession() {
    }

    public VerificationSession(
            Long fraudCaseId,
            boolean questionOneAnswer,
            boolean questionTwoAnswer,
            boolean questionThreeAnswer,
            int previousRiskScore,
            int addedRiskScore,
            int finalRiskScore,
            RiskLevel riskLevel,
            String recommendedAction
    ) {
        this.fraudCaseId = fraudCaseId;
        this.questionOneAnswer = questionOneAnswer;
        this.questionTwoAnswer = questionTwoAnswer;
        this.questionThreeAnswer = questionThreeAnswer;
        this.previousRiskScore = previousRiskScore;
        this.addedRiskScore = addedRiskScore;
        this.finalRiskScore = finalRiskScore;
        this.riskLevel = riskLevel;
        this.recommendedAction = recommendedAction;
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

    public boolean isQuestionOneAnswer() {
        return questionOneAnswer;
    }

    public boolean isQuestionTwoAnswer() {
        return questionTwoAnswer;
    }

    public boolean isQuestionThreeAnswer() {
        return questionThreeAnswer;
    }

    public int getPreviousRiskScore() {
        return previousRiskScore;
    }

    public int getAddedRiskScore() {
        return addedRiskScore;
    }

    public int getFinalRiskScore() {
        return finalRiskScore;
    }

    public RiskLevel getRiskLevel() {
        return riskLevel;
    }

    public String getRecommendedAction() {
        return recommendedAction;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
}