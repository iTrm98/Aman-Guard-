package com.amanguard.backend.feature.realtime.service;

import com.amanguard.backend.feature.realtime.dto.CaseRealtimeMessage;
import com.amanguard.backend.feature.realtime.dto.NotificationRealtimeMessage;
import com.amanguard.backend.feature.realtime.dto.RealtimeStatusMessage;

public interface RealtimePublishService {

    void publishCase(CaseRealtimeMessage message);

    void publishNotification(NotificationRealtimeMessage message);

    void publishStatus(RealtimeStatusMessage message);
}