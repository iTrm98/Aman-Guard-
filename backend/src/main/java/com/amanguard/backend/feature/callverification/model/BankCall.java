package com.amanguard.backend.feature.callverification.model;

import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "bank_calls")
public class BankCall {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(
            name = "caller_number",
            nullable = false,
            length = 20
    )
    private String callerNumber;

    @Column(
            name = "caller_name",
            nullable = false,
            length = 100
    )
    private String callerName;

    @Column(
            name = "official_call",
            nullable = false
    )
    private boolean officialCall;

    @Column(nullable = false)
    private boolean active;

    @Column(
            name = "started_at",
            nullable = false
    )
    private LocalDateTime startedAt;

    public BankCall() {
    }

    public BankCall(
            String callerNumber,
            String callerName,
            boolean officialCall,
            boolean active
    ) {
        this.callerNumber = callerNumber;
        this.callerName = callerName;
        this.officialCall = officialCall;
        this.active = active;
    }

    @PrePersist
    public void beforeSave() {
        startedAt = LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public String getCallerNumber() {
        return callerNumber;
    }

    public String getCallerName() {
        return callerName;
    }

    public boolean isOfficialCall() {
        return officialCall;
    }

    public boolean isActive() {
        return active;
    }

    public LocalDateTime getStartedAt() {
        return startedAt;
    }
}