package com.amanguard.backend.feature.audit.config;

import com.amanguard.backend.feature.audit.service.AuditLogService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

@Component
public class AuditLogInterceptor implements HandlerInterceptor {

    private final AuditLogService auditLogService;

    public AuditLogInterceptor(
            AuditLogService auditLogService
    ) {
        this.auditLogService = auditLogService;
    }

    @Override
    public void afterCompletion(
            HttpServletRequest request,
            HttpServletResponse response,
            Object handler,
            Exception exception
    ) {
        try {
            Authentication authentication =
                    SecurityContextHolder
                            .getContext()
                            .getAuthentication();

            if (authentication == null
                    || !authentication.isAuthenticated()
                    || !isBankOfficer(authentication)) {
                return;
            }

            String path = request.getRequestURI();

            if (path == null
                    || path.startsWith("/api/auth")
                    || path.startsWith("/h2-console")) {
                return;
            }

            String officerId = String.valueOf(
                    authentication.getPrincipal()
            );

            auditLogService.recordOfficerAction(
                    officerId,
                    buildAction(
                            request.getMethod(),
                            path
                    ),
                    request.getMethod(),
                    path,
                    request.getQueryString(),
                    response.getStatus(),
                    getClientIp(request),
                    request.getHeader("User-Agent")
            );
        } catch (Exception ignored) {
            // Audit logging must never break the main request.
        }
    }

    private boolean isBankOfficer(Authentication authentication) {
        return authentication
                .getAuthorities()
                .stream()
                .map(GrantedAuthority::getAuthority)
                .anyMatch("ROLE_BANK_OFFICER"::equals);
    }

    private String buildAction(
            String method,
            String path
    ) {
        if ("GET".equalsIgnoreCase(method)
                && path.startsWith("/api/cases")) {
            return "VIEW_CASES";
        }

        if ("POST".equalsIgnoreCase(method)
                && path.startsWith("/api/cases")) {
            return "CREATE_CASE";
        }

        if ("PUT".equalsIgnoreCase(method)
                && path.startsWith("/api/cases")) {
            return "UPDATE_CASE";
        }

        if ("PATCH".equalsIgnoreCase(method)
                && path.contains("/approve")) {
            return "APPROVE_FREEZE";
        }

        if ("PATCH".equalsIgnoreCase(method)
                && path.contains("/reject")) {
            return "REJECT_FREEZE";
        }

        if (path.startsWith("/api/customers")) {
            return "LOOKUP_CUSTOMER";
        }

        if (path.startsWith("/api/config")) {
            return "VIEW_CONFIG";
        }

        if (path.startsWith("/api/notifications")) {
            return "MANAGE_NOTIFICATIONS";
        }

        if (path.startsWith("/api/audit-logs")) {
            return "VIEW_AUDIT_LOGS";
        }

        return method.toUpperCase() + " " + path;
    }

    private String getClientIp(HttpServletRequest request) {
        String forwardedFor = request.getHeader("X-Forwarded-For");

        if (forwardedFor != null && !forwardedFor.isBlank()) {
            return forwardedFor.split(",")[0].trim();
        }

        return request.getRemoteAddr();
    }
}