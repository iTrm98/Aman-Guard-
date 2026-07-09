package com.amanguard.backend.feature.realtime.service.impl;

import com.amanguard.backend.feature.realtime.dto.CaseRealtimeMessage;
import com.amanguard.backend.feature.realtime.dto.NotificationRealtimeMessage;
import com.amanguard.backend.feature.realtime.dto.RealtimeStatusMessage;
import com.amanguard.backend.feature.realtime.service.RealtimePublishService;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

@Service
public class RealtimePublishServiceImpl implements RealtimePublishService {

    public static final String CASES_TOPIC = "/topic/cases";
    public static final String NOTIFICATIONS_TOPIC = "/topic/notifications";
    public static final String STATUS_TOPIC = "/topic/realtime-status";

    private final SimpMessagingTemplate messagingTemplate;

    public RealtimePublishServiceImpl(
            SimpMessagingTemplate messagingTemplate
    ) {
        this.messagingTemplate = messagingTemplate;
    }

    @Override
    public void publishCase(
            CaseRealtimeMessage message
    ) {
        messagingTemplate.convertAndSend(
                CASES_TOPIC,
                message
        );
    }

    @Override
    public void publishNotification(
            NotificationRealtimeMessage message
    ) {
        messagingTemplate.convertAndSend(
                NOTIFICATIONS_TOPIC,
                message
        );
    }

    @Override
    public void publishStatus(
            RealtimeStatusMessage message
    ) {
        messagingTemplate.convertAndSend(
                STATUS_TOPIC,
                message
        );
    }
}