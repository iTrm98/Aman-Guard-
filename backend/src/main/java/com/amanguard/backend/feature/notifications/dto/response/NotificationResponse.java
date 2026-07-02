package com.amanguard.backend.feature.notifications.dto.response;

public record NotificationResponse(
        Long id,
        boolean read,
        String icon,
        String titleAr,
        String titleEn,
        String bodyAr,
        String bodyEn,
        String type,
        Long caseId,
        String createdAt
) {
}
