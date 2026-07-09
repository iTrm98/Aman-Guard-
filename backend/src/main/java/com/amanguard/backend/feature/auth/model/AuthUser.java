package com.amanguard.backend.feature.auth.model;

import jakarta.persistence.*;

import java.time.Instant;

@Entity
@Table(name = "auth_users")
public class AuthUser {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(
            name = "national_id",
            nullable = false,
            unique = true,
            length = 20
    )
    private String nationalId;

    @Column(
            name = "account_number",
            nullable = false,
            unique = true,
            length = 50
    )
    private String accountNumber;

    @Column(nullable = false, length = 20)
    private String phone;

    @Column(name = "display_name", nullable = false, length = 120)
    private String displayName;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private UserRole role;

    @Column(name = "pin_hash", nullable = false, length = 120)
    private String pinHash;

    @Column(name = "refresh_token_hash", length = 200)
    private String refreshTokenHash;

    @Column(nullable = false)
    private boolean enabled = true;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    public AuthUser() {
    }

    public AuthUser(
            String nationalId,
            String accountNumber,
            String phone,
            String displayName,
            UserRole role,
            String pinHash
    ) {
        this.nationalId = nationalId;
        this.accountNumber = accountNumber;
        this.phone = phone;
        this.displayName = displayName;
        this.role = role;
        this.pinHash = pinHash;
        this.enabled = true;
    }

    @PrePersist
    public void prePersist() {
        Instant now = Instant.now();
        this.createdAt = now;
        this.updatedAt = now;
    }

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = Instant.now();
    }

    public Long getId() {
        return id;
    }

    public String getNationalId() {
        return nationalId;
    }

    public String getAccountNumber() {
        return accountNumber;
    }

    public String getPhone() {
        return phone;
    }

    public String getDisplayName() {
        return displayName;
    }

    public UserRole getRole() {
        return role;
    }

    public String getPinHash() {
        return pinHash;
    }

    public String getRefreshTokenHash() {
        return refreshTokenHash;
    }

    public boolean isEnabled() {
        return enabled;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setRefreshTokenHash(String refreshTokenHash) {
        this.refreshTokenHash = refreshTokenHash;
    }

    public void disable() {
        this.enabled = false;
    }
}