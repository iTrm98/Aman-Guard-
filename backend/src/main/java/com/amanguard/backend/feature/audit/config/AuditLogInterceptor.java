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
                    || !authentication.isAuthenticated()) {
                return;
            }

            boolean isOfficer = isBankOfficer(authentication);

            // Officers: every request (unchanged behavior). Customers: only
            // state-changing requests — auditing their GETs would flood the
            // table with the 60-second notification polling and account reads.
            if (!isOfficer
                    && "GET".equalsIgnoreCase(request.getMethod())) {
                return;
            }

            String path = request.getRequestURI();

            if (path == null
                    || path.startsWith("/api/auth")
                    || path.startsWith("/h2-console")) {
                return;
            }

            String userId = String.valueOf(
                    authentication.getPrincipal()
            );

            auditLogService.recordUserAction(
                    userId,
                    resolveRole(authentication),
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

    private String resolveRole(Authentication authentication) {
        return authentication
                .getAuthorities()
                .stream()
                .map(GrantedAuthority::getAuthority)
                .filter(a -> a.startsWith("ROLE_"))
                .map(a -> a.substring("ROLE_".length()))
                .findFirst()
                .orElse("UNKNOWN");
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

        // Customer-flow tokens (recorded since audit coverage was widened
        // beyond officers). Kept semantic so the SOC audit page can map them
        // to human-readable bilingual labels.
        if ("POST".equalsIgnoreCase(method)
                && path.equals("/api/analyze")) {
            return "ANALYZE_TEXT";
        }

        if ("POST".equalsIgnoreCase(method)
                && path.equals("/api/freeze")) {
            return "REQUEST_FREEZE";
        }

        if ("POST".equalsIgnoreCase(method)
                && path.equals("/api/transactions/analyze")) {
            return "ANALYZE_TRANSACTION";
        }

        if ("POST".equalsIgnoreCase(method)
                && path.endsWith("/confirm")
                && path.startsWith("/api/transactions")) {
            return "CONFIRM_TRANSACTION";
        }

        if ("POST".equalsIgnoreCase(method)
                && path.endsWith("/cancel")
                && path.startsWith("/api/transactions")) {
            return "CANCEL_TRANSACTION";
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