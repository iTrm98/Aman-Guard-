package com.amanguard.backend.common.ratelimit;

import com.amanguard.backend.common.security.CurrentUserService;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.Refill;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Duration;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * In-memory, per-minute rate limiting. Keyed by the authenticated national id
 * when present, otherwise by client IP (so unauthenticated login attempts are
 * limited per IP). Each (actor, endpoint-class) pair gets its own bucket.
 *
 * Registered in {@code SecurityConfig} AFTER {@code JwtAuthenticationFilter} so
 * the principal is available for keying.
 */
@Component
public class RateLimitingFilter extends OncePerRequestFilter {

    private static final int RETRY_AFTER_SECONDS = 60;

    private final CurrentUserService currentUserService;
    private final ObjectMapper objectMapper;
    private final ConcurrentHashMap<String, Bucket> buckets = new ConcurrentHashMap<>();

    public RateLimitingFilter(
            CurrentUserService currentUserService,
            ObjectMapper objectMapper
    ) {
        this.currentUserService = currentUserService;
        this.objectMapper = objectMapper;
    }

    // (endpoint-class name, requests per minute)
    private record LimitRule(String name, int capacity) {
    }

    private LimitRule ruleFor(HttpServletRequest request) {
        String path = request.getRequestURI();
        boolean post = "POST".equalsIgnoreCase(request.getMethod());

        if (post && "/api/analyze".equals(path)) {
            return new LimitRule("analyze", 30);
        }
        if (post && "/api/auth/login".equals(path)) {
            return new LimitRule("login", 5);
        }
        if (post && "/api/transactions/analyze".equals(path)) {
            return new LimitRule("transactions-analyze", 20);
        }
        if (post && "/api/freeze".equals(path)) {
            return new LimitRule("freeze", 10);
        }
        return new LimitRule("default", 100);
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {
        LimitRule rule = ruleFor(request);
        Bucket bucket = buckets.computeIfAbsent(
                actorKey(request, rule),
                key -> newBucket(rule.capacity())
        );

        if (bucket.tryConsume(1)) {
            filterChain.doFilter(request, response);
        } else {
            writeTooManyRequests(response);
        }
    }

    private String actorKey(HttpServletRequest request, LimitRule rule) {
        String nationalId = currentUserService.currentNationalId();
        String principal = nationalId != null
                ? "user:" + nationalId
                : "ip:" + clientIp(request);

        return principal + ":" + rule.name();
    }

    private Bucket newBucket(int capacity) {
        Bandwidth limit = Bandwidth.classic(
                capacity,
                Refill.greedy(capacity, Duration.ofMinutes(1))
        );
        return Bucket.builder().addLimit(limit).build();
    }

    private String clientIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }

    private void writeTooManyRequests(HttpServletResponse response) throws IOException {
        response.setStatus(429);
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setHeader("Retry-After", String.valueOf(RETRY_AFTER_SECONDS));

        // Ordered map so the JSON matches the documented body shape.
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("error", "RATE_LIMIT_EXCEEDED");
        body.put("messageAr", "تجاوزت الحد المسموح به. يرجى الانتظار دقيقة.");
        body.put("messageEn", "Rate limit exceeded. Please wait a minute.");
        body.put("retryAfterSeconds", RETRY_AFTER_SECONDS);

        objectMapper.writeValue(response.getOutputStream(), body);
    }
}
