package com.amanguard.backend.feature.audit.controller;

import com.amanguard.backend.feature.audit.dto.AuditLogPageResponse;
import com.amanguard.backend.feature.audit.dto.AuditLogResponse;
import com.amanguard.backend.feature.audit.service.AuditLogService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/audit-logs")
public class AuditLogController {

    private final AuditLogService auditLogService;

    public AuditLogController(
            AuditLogService auditLogService
    ) {
        this.auditLogService = auditLogService;
    }

    /**
     * Paged, filterable audit trail for the SOC audit page.
     * from/to are ISO dates interpreted as Saudi (Asia/Riyadh) calendar days;
     * action and search are optional contains-filters (search matches the
     * user id or the IP address).
     */
    @GetMapping
    public ResponseEntity<AuditLogPageResponse> searchLogs(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(required = false) String action,
            @RequestParam(required = false) String search
    ) {
        return ResponseEntity.ok(
                auditLogService.searchLogs(
                        page,
                        size,
                        from,
                        to,
                        action,
                        search
                )
        );
    }

    @GetMapping("/officer/{officerId}")
    public ResponseEntity<List<AuditLogResponse>> getOfficerLogs(
            @PathVariable String officerId,
            @RequestParam(defaultValue = "20") int limit
    ) {
        return ResponseEntity.ok(
                auditLogService.getOfficerLogs(
                        officerId,
                        limit
                )
        );
    }
}
