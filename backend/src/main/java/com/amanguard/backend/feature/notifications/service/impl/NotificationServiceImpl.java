package com.amanguard.backend.feature.notifications.service.impl;

import com.amanguard.backend.common.exception.ResourceNotFoundException;
import com.amanguard.backend.feature.notifications.dto.response.NotificationResponse;
import com.amanguard.backend.feature.notifications.model.Notification;
import com.amanguard.backend.feature.notifications.repository.NotificationRepository;
import com.amanguard.backend.feature.notifications.service.NotificationService;
import com.amanguard.backend.feature.realtime.dto.NotificationRealtimeMessage;
import com.amanguard.backend.feature.realtime.service.RealtimePublishService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class NotificationServiceImpl implements NotificationService {

    private final NotificationRepository notificationRepository;
    private final RealtimePublishService realtimePublishService;

    public NotificationServiceImpl(
            NotificationRepository notificationRepository,
            RealtimePublishService realtimePublishService
    ) {
        this.notificationRepository = notificationRepository;
        this.realtimePublishService = realtimePublishService;
    }

    @Override
    public List<NotificationResponse> getNotifications() {
        return notificationRepository
                .findAllNewestFirst()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    @Transactional
    public NotificationResponse markRead(Long notificationId) {
        Notification notification = notificationRepository
                .findById(notificationId)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "الإشعار غير موجود: " + notificationId
                        )
                );

        notification.markRead();

        Notification savedNotification =
                notificationRepository.save(notification);

        publishNotificationEvent(
                savedNotification,
                "READ_NOTIFICATION"
        );

        return toResponse(savedNotification);
    }

    @Override
    @Transactional
    public void markAllRead() {
        List<Notification> notifications =
                notificationRepository.findAll();

        notifications.forEach(Notification::markRead);

        notificationRepository.saveAll(notifications);

        realtimePublishService.publishNotification(
                new NotificationRealtimeMessage(
                        null,
                        "READ_ALL_NOTIFICATIONS",
                        "✅",
                        "تم قراءة كل الإشعارات",
                        "All Notifications Read",
                        "تم تحديث حالة جميع الإشعارات إلى مقروءة",
                        "All notifications have been marked as read",
                        "status",
                        null,
                        LocalDateTime.now()
                )
        );
    }

    private NotificationResponse toResponse(
            Notification notification
    ) {
        return new NotificationResponse(
                notification.getId(),
                notification.isRead(),
                notification.getIcon(),
                notification.getTitleAr(),
                notification.getTitleEn(),
                notification.getBodyAr(),
                notification.getBodyEn(),
                notification.getType(),
                notification.getCaseId(),
                notification.getCreatedAt().toString()
        );
    }

    private void publishNotificationEvent(
            Notification notification,
            String eventType
    ) {
        realtimePublishService.publishNotification(
                new NotificationRealtimeMessage(
                        notification.getId(),
                        eventType,
                        notification.getIcon(),
                        notification.getTitleAr(),
                        notification.getTitleEn(),
                        notification.getBodyAr(),
                        notification.getBodyEn(),
                        notification.getType(),
                        notification.getCaseId(),
                        notification.getCreatedAt()
                )
        );
    }
}