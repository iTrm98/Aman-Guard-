package com.amanguard.backend.feature.notifications.service.impl;

import com.amanguard.backend.common.exception.ResourceNotFoundException;
import com.amanguard.backend.feature.notifications.dto.response.NotificationResponse;
import com.amanguard.backend.feature.notifications.model.Notification;
import com.amanguard.backend.feature.notifications.repository.NotificationRepository;
import com.amanguard.backend.feature.notifications.service.NotificationService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class NotificationServiceImpl implements NotificationService {

    private final NotificationRepository notificationRepository;

    public NotificationServiceImpl(
            NotificationRepository notificationRepository
    ) {
        this.notificationRepository = notificationRepository;
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

        return toResponse(
                notificationRepository.save(notification)
        );
    }

    @Override
    @Transactional
    public void markAllRead() {
        List<Notification> notifications =
                notificationRepository.findAll();

        notifications.forEach(Notification::markRead);

        notificationRepository.saveAll(notifications);
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
}
