package com.amanguard.backend.feature.audit.repository;

import com.amanguard.backend.feature.audit.model.AuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface AuditLogRepository
        extends JpaRepository<AuditLog, Long> {

    List<AuditLog> findByOfficerIdOrderByCreatedAtDesc(
            String officerId,
            Pageable pageable
    );

    // from/to are always non-null (normalized in the service); action and
    // search are optional contains-filters. search matches user id or IP.
    @Query("""
            SELECT a FROM AuditLog a
            WHERE a.createdAt >= :from
              AND a.createdAt < :to
              AND (:action IS NULL OR a.action LIKE CONCAT('%', :action, '%'))
              AND (:search IS NULL
                   OR a.officerId LIKE CONCAT('%', :search, '%')
                   OR a.ipAddress LIKE CONCAT('%', :search, '%'))
            ORDER BY a.createdAt DESC
            """)
    Page<AuditLog> search(
            @Param("from") LocalDateTime from,
            @Param("to") LocalDateTime to,
            @Param("action") String action,
            @Param("search") String search,
            Pageable pageable
    );
}
