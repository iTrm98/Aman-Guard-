package com.amanguard.backend.feature.audit.repository;

import com.amanguard.backend.feature.audit.model.AuditLog;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AuditLogRepository
        extends JpaRepository<AuditLog, Long> {

    List<AuditLog> findAllByOrderByCreatedAtDesc(Pageable pageable);

    List<AuditLog> findByOfficerIdOrderByCreatedAtDesc(
            String officerId,
            Pageable pageable
    );
}