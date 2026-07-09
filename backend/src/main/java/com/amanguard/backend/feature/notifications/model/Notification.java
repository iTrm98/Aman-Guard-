package com.amanguard.backend.feature.notifications.model;

import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "notifications")
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 10)
    private String icon;

    @Column(name = "title_ar", nullable = false, length = 200)
    private String titleAr;

    @Column(name = "title_en", nullable = false, length = 200)
    private String titleEn;

    @Column(name = "body_ar", nullable = false, length = 500)
    private String bodyAr;

    @Column(name = "body_en", nullable = false, length = 500)
    private String bodyEn;

    @Column(name = "is_read", nullable = false)
    private boolean read;

    @Column(nullable = false, length = 20)
    private String type;

    @Column(name = "case_id")
    private Long caseId;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    public Notification() {
    }

    public Notification(
            String icon,
            String titleAr,
            String titleEn,
            String bodyAr,
            String bodyEn,
            boolean read,
            String type,
            Long caseId,
            LocalDateTime createdAt
    ) {
        this.icon = icon;
        this.titleAr = titleAr;
        this.titleEn = titleEn;
        this.bodyAr = bodyAr;
        this.bodyEn = bodyEn;
        this.read = read;
        this.type = type;
        this.caseId = caseId;
        this.createdAt = createdAt;
    }

    public void markRead() {
        read = true;
    }

    public Long getId() {
        return id;
    }

    public String getIcon() {
        return icon;
    }

    public String getTitleAr() {
        return titleAr;
    }

    public String getTitleEn() {
        return titleEn;
    }

    public String getBodyAr() {
        return bodyAr;
    }

    public String getBodyEn() {
        return bodyEn;
    }

    public boolean isRead() {
        return read;
    }

    public String getType() {
        return type;
    }

    public Long getCaseId() {
        return caseId;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
}