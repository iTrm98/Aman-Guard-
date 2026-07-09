package com.amanguard.backend.feature.realtime.dto;

import java.time.LocalDateTime;

public record NotificationRealtimeMessage(
        Long notificationId,
        String eventType,
        String icon,
        String titleAr,
        String titleEn,
        String bodyAr,
        String bodyEn,
        String type,
        Long caseId,
        LocalDateTime createdAt
) {
}