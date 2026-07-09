package com.amanguard.backend.feature.realtime.controller;

import com.amanguard.backend.feature.realtime.dto.CaseRealtimeMessage;
import com.amanguard.backend.feature.realtime.dto.NotificationRealtimeMessage;
import com.amanguard.backend.feature.realtime.dto.RealtimeStatusMessage;
import com.amanguard.backend.feature.realtime.service.RealtimePublishService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Map;

@RestController
@RequestMapping("/api/realtime-test")
public class RealtimeTestController {

    private final RealtimePublishService realtimePublishService;

    public RealtimeTestController(
            RealtimePublishService realtimePublishService
    ) {
        this.realtimePublishService = realtimePublishService;
    }

    @PostMapping("/case")
    public ResponseEntity<Map<String, Object>> publishCaseTest() {
        CaseRealtimeMessage message = new CaseRealtimeMessage(
                999L,
                "NEW_CASE",
                "CRITICAL",
                96,
                "نواف العتيبي",
                "OTP_REQUEST_BANK_IMPERSONATION",
                "SA0000000000000000004821",
                "0555556666",
                new BigDecimal("12500.00"),
                LocalDateTime.now(),
                "تم رصد حالة احتيال حرجة جديدة",
                "New critical fraud case detected"
        );

        realtimePublishService.publishCase(message);

        return ResponseEntity.ok(
                Map.of(
                        "published", true,
                        "topic", "/topic/cases",
                        "message", message
                )
        );
    }

    @PostMapping("/notification")
    public ResponseEntity<Map<String, Object>> publishNotificationTest() {
        NotificationRealtimeMessage message =
                new NotificationRealtimeMessage(
                        999L,
                        "NEW_NOTIFICATION",
                        "🚨",
                        "حالة حرجة جديدة",
                        "New Critical Case",
                        "تم رصد محاولة طلب رمز تحقق",
                        "OTP fraud attempt detected",
                        "warning",
                        999L,
                        LocalDateTime.now()
                );

        realtimePublishService.publishNotification(message);

        return ResponseEntity.ok(
                Map.of(
                        "published", true,
                        "topic", "/topic/notifications",
                        "message", message
                )
        );
    }

    @PostMapping("/status")
    public ResponseEntity<Map<String, Object>> publishStatusTest() {
        RealtimeStatusMessage message =
                new RealtimeStatusMessage(
                        "CONNECTED",
                        "Realtime channel is active",
                        LocalDateTime.now()
                );

        realtimePublishService.publishStatus(message);

        return ResponseEntity.ok(
                Map.of(
                        "published", true,
                        "topic", "/topic/realtime-status",
                        "message", message
                )
        );
    }
}