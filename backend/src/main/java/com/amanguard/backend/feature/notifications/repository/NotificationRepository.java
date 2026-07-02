package com.amanguard.backend.feature.notifications.repository;

import com.amanguard.backend.feature.notifications.model.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Sort;

import java.util.List;

public interface NotificationRepository
        extends JpaRepository<Notification, Long> {

    default List<Notification> findAllNewestFirst() {
        return findAll(Sort.by(Sort.Direction.DESC, "createdAt"));
    }
}
