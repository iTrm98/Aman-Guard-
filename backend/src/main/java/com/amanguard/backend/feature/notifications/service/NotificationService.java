package com.amanguard.backend.feature.notifications.service;

import com.amanguard.backend.feature.notifications.dto.response.NotificationResponse;

import java.util.List;

public interface NotificationService {

    List<NotificationResponse> getNotifications();

    NotificationResponse markRead(Long notificationId);

    void markAllRead();
}
