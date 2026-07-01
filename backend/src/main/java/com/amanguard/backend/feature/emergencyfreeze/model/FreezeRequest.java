package com.amanguard.backend.feature.emergencyfreeze.model;

import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "freeze_requests")
public class FreezeRequest {

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
            length = 255
    )
    private String reason;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private FreezeStatus status;

    @Column(
            name = "report_number",
            nullable = false,
            unique = true,
            length = 30
    )
    private String reportNumber;

    @Column(
            name = "created_at",
            nullable = false
    )
    private LocalDateTime createdAt;

    @Column(
            name = "updated_at",
            nullable = false
    )
    private LocalDateTime updatedAt;

    public FreezeRequest() {
    }

    public FreezeRequest(
            Long fraudCaseId,
            String reason,
            FreezeStatus status,
            String reportNumber
    ) {
        this.fraudCaseId = fraudCaseId;
        this.reason = reason;
        this.status = status;
        this.reportNumber = reportNumber;
    }

    @PrePersist
    public void beforeSave() {
        LocalDateTime now = LocalDateTime.now();

        createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    public void beforeUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public void approve() {
        status = FreezeStatus.APPROVED;
    }

    public void reject() {
        status = FreezeStatus.REJECTED;
    }

    public Long getId() {
        return id;
    }

    public Long getFraudCaseId() {
        return fraudCaseId;
    }

    public String getReason() {
        return reason;
    }

    public FreezeStatus getStatus() {
        return status;
    }

    public String getReportNumber() {
        return reportNumber;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
}