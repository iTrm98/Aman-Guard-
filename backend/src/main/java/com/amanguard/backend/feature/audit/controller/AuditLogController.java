package com.amanguard.backend.feature.audit.controller;

import com.amanguard.backend.feature.audit.dto.AuditLogResponse;
import com.amanguard.backend.feature.audit.service.AuditLogService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

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

    @GetMapping
    public ResponseEntity<List<AuditLogResponse>> getLatestLogs(
            @RequestParam(defaultValue = "20") int limit
    ) {
        return ResponseEntity.ok(
                auditLogService.getLatestLogs(limit)
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