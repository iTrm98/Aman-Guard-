package com.amanguard.backend.feature.realtime.dto;

import java.time.LocalDateTime;

public record RealtimeStatusMessage(
        String status,
        String message,
        LocalDateTime serverTime
) {
}