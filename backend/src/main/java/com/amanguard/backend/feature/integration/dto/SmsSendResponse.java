package com.amanguard.backend.feature.integration.dto;

import java.time.LocalDateTime;

public record SmsSendResponse(
        String provider,
        String messageId,
        String phoneNumber,
        String status,
        String purpose,
        LocalDateTime sentAt,
        String todo
) {
}