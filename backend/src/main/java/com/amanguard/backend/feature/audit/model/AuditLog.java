package com.amanguard.backend.feature.audit.model;

import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "audit_logs")
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "officer_id", nullable = false, length = 50)
    private String officerId;

    @Column(name = "user_role", nullable = false, length = 20)
    private String userRole;

    @Column(nullable = false, length = 120)
    private String action;

    @Column(name = "http_method", nullable = false, length = 10)
    private String httpMethod;

    @Column(nullable = false, length = 500)
    private String path;

    @Column(name = "query_string", length = 1000)
    private String queryString;

    @Column(name = "status_code", nullable = false)
    private int statusCode;

    @Column(name = "ip_address", length = 80)
    private String ipAddress;

    @Column(name = "user_agent", length = 500)
    private String userAgent;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    public AuditLog() {
    }

    public AuditLog(
            String officerId,
            String userRole,
            String action,
            String httpMethod,
            String path,
            String queryString,
            int statusCode,
            String ipAddress,
            String userAgent,
            LocalDateTime createdAt
    ) {
        this.officerId = officerId;
        this.userRole = userRole;
        this.action = action;
        this.httpMethod = httpMethod;
        this.path = path;
        this.queryString = queryString;
        this.statusCode = statusCode;
        this.ipAddress = ipAddress;
        this.userAgent = userAgent;
        this.createdAt = createdAt;
    }

    public Long getId() {
        return id;
    }

    public String getOfficerId() {
        return officerId;
    }

    public String getUserRole() {
        return userRole;
    }

    public String getAction() {
        return action;
    }

    public String getHttpMethod() {
        return httpMethod;
    }

    public String getPath() {
        return path;
    }

    public String getQueryString() {
        return queryString;
    }

    public int getStatusCode() {
        return statusCode;
    }

    public String getIpAddress() {
        return ipAddress;
    }

    public String getUserAgent() {
        return userAgent;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
}