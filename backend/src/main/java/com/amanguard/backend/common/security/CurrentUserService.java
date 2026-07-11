package com.amanguard.backend.common.security;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

/**
 * Reads the authenticated principal set by {@code JwtAuthenticationFilter}
 * (principal = national id, authority = ROLE_CUSTOMER / ROLE_BANK_OFFICER).
 * Shared by fraud-analysis audit logging, per-user notification filtering, and
 * the rate-limiting key. Returns null / false for unauthenticated requests.
 */
@Component
public class CurrentUserService {

    private static final String ROLE_BANK_OFFICER = "ROLE_BANK_OFFICER";
    private static final String ROLE_CUSTOMER = "ROLE_CUSTOMER";

    /** National id of the current user, or null if unauthenticated. */
    public String currentNationalId() {
        Authentication authentication = authentication();

        if (authentication == null || !authentication.isAuthenticated()) {
            return null;
        }

        Object principal = authentication.getPrincipal();

        if (principal == null || "anonymousUser".equals(principal)) {
            return null;
        }

        return String.valueOf(principal);
    }

    public boolean isOfficer() {
        return hasAuthority(ROLE_BANK_OFFICER);
    }

    public boolean isCustomer() {
        return hasAuthority(ROLE_CUSTOMER);
    }

    private boolean hasAuthority(String authorityName) {
        Authentication authentication = authentication();

        if (authentication == null) {
            return false;
        }

        for (GrantedAuthority authority : authentication.getAuthorities()) {
            if (authorityName.equals(authority.getAuthority())) {
                return true;
            }
        }

        return false;
    }

    private Authentication authentication() {
        return SecurityContextHolder.getContext().getAuthentication();
    }
}
