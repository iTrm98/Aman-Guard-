package com.amanguard.backend.feature.auth.model;

import jakarta.persistence.*;

import java.time.Instant;

@Entity
@Table(name = "token_blacklist")
public class TokenBlacklist {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(
            name = "jwt_id",
            nullable = false,
            unique = true,
            length = 80
    )
    private String jwtId;

    @Column(name = "expires_at", nullable = false)
    private Instant expiresAt;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    public TokenBlacklist() {
    }

    public TokenBlacklist(
            String jwtId,
            Instant expiresAt
    ) {
        this.jwtId = jwtId;
        this.expiresAt = expiresAt;
    }

    @PrePersist
    public void prePersist() {
        this.createdAt = Instant.now();
    }

    public Long getId() {
        return id;
    }

    public String getJwtId() {
        return jwtId;
    }

    public Instant getExpiresAt() {
        return expiresAt;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}