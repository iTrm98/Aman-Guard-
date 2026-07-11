package com.amanguard.backend.feature.notifications.repository;

import com.amanguard.backend.feature.notifications.model.Notification;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface NotificationRepository
        extends JpaRepository<Notification, Long> {

    // Officer broadcasts (no specific recipient), newest first.
    List<Notification> findByRecipientNationalIdIsNullOrderByCreatedAtDesc();

    // A single customer's own notifications, newest first.
    List<Notification> findByRecipientNationalIdOrderByCreatedAtDesc(
            String recipientNationalId
    );
}
