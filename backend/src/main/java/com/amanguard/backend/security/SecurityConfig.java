package com.amanguard.backend.security;

import com.amanguard.backend.common.response.ApiErrorResponse;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

import java.time.LocalDateTime;
import java.util.Map;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final ObjectMapper objectMapper;

    public SecurityConfig(
            JwtAuthenticationFilter jwtAuthenticationFilter,
            ObjectMapper objectMapper
    ) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
        this.objectMapper = objectMapper;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(
            HttpSecurity http
    ) throws Exception {
        return http
                .csrf(csrf -> csrf.disable())
                .cors(Customizer.withDefaults())
                .headers(headers ->
                        headers.frameOptions(frameOptions ->
                                frameOptions.sameOrigin()
                        )
                )
                .sessionManagement(session ->
                        session.sessionCreationPolicy(
                                SessionCreationPolicy.STATELESS
                        )
                )
                .exceptionHandling(exceptionHandling ->
                        exceptionHandling
                                .authenticationEntryPoint(
                                        (request, response, exception) ->
                                                writeError(
                                                        response,
                                                        HttpServletResponse.SC_UNAUTHORIZED,
                                                        "UNAUTHORIZED",
                                                        "يجب تسجيل الدخول للوصول لهذا المسار",
                                                        request.getRequestURI()
                                                )
                                )
                                .accessDeniedHandler(
                                        (request, response, exception) ->
                                                writeError(
                                                        response,
                                                        HttpServletResponse.SC_FORBIDDEN,
                                                        "FORBIDDEN",
                                                        "ليس لديك صلاحية للوصول لهذا المسار",
                                                        request.getRequestURI()
                                                )
                                )
                )
                .authorizeHttpRequests(auth -> auth

                        .requestMatchers(
                                HttpMethod.OPTIONS,
                                "/**"
                        ).permitAll()

                        .requestMatchers(
                                "/api/auth/**"
                        ).permitAll()

                        .requestMatchers(
                                "/ws/**"
                        ).permitAll()

                        .requestMatchers(
                                "/h2-console/**"
                        ).permitAll()

                        // Customer endpoints
                        .requestMatchers(
                                "/api/account/**"
                        ).hasRole("CUSTOMER")

                        .requestMatchers(
                                "/api/transactions/**"
                        ).hasRole("CUSTOMER")

                        .requestMatchers(
                                "/api/verifications/**"
                        ).hasRole("CUSTOMER")

                        .requestMatchers(
                                HttpMethod.POST,
                                "/api/freeze"
                        ).hasRole("CUSTOMER")

                        // Bank officer endpoints
                        .requestMatchers(
                                "/api/cases/**"
                        ).hasRole("BANK_OFFICER")

                        .requestMatchers(
                                "/api/customers/**"
                        ).hasRole("BANK_OFFICER")

                        .requestMatchers(
                                "/api/config/**"
                        ).hasRole("BANK_OFFICER")

                        .requestMatchers(
                                "/api/audit-logs/**"
                        ).hasRole("BANK_OFFICER")

                        .requestMatchers(
                                "/api/analytics/**"
                        ).hasRole("BANK_OFFICER")

                        .requestMatchers(
                                "/api/realtime-test/**"
                        ).hasRole("BANK_OFFICER")

                        .requestMatchers(
                                "/api/open-banking/**"
                        ).hasRole("BANK_OFFICER")

                        .requestMatchers(
                                "/api/sms/**"
                        ).hasRole("BANK_OFFICER")

                        .requestMatchers(
                                "/api/telephony/**"
                        ).hasRole("BANK_OFFICER")

                        .requestMatchers(
                                "/api/merchant-registry/**"
                        ).hasRole("BANK_OFFICER")

                        .requestMatchers(
                                HttpMethod.PATCH,
                                "/api/freeze/*/approve"
                        ).hasRole("BANK_OFFICER")

                        .requestMatchers(
                                HttpMethod.PATCH,
                                "/api/freeze/*/reject"
                        ).hasRole("BANK_OFFICER")

                        .requestMatchers(
                                HttpMethod.PATCH,
                                "/api/freeze/*/unfreeze"
                        ).hasRole("BANK_OFFICER")

                        // Shared endpoints
                        .requestMatchers(
                                "/api/notifications/**"
                        ).hasAnyRole(
                                "CUSTOMER",
                                "BANK_OFFICER"
                        )

                        .requestMatchers(
                                HttpMethod.GET,
                                "/api/freeze/**"
                        ).hasAnyRole(
                                "CUSTOMER",
                                "BANK_OFFICER"
                        )

                        .requestMatchers(
                                "/api/call-status"
                        ).hasAnyRole(
                                "CUSTOMER",
                                "BANK_OFFICER"
                        )

                        .requestMatchers(
                                HttpMethod.POST,
                                "/api/analyze"
                        ).hasAnyRole(
                                "CUSTOMER",
                                "BANK_OFFICER"
                        )

                        .anyRequest()
                        .authenticated()
                )
                .addFilterBefore(
                        jwtAuthenticationFilter,
                        UsernamePasswordAuthenticationFilter.class
                )
                .build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    private void writeError(
            HttpServletResponse response,
            int status,
            String error,
            String message,
            String path
    ) throws java.io.IOException {
        response.setStatus(status);
        response.setContentType(
                MediaType.APPLICATION_JSON_VALUE
        );

        ApiErrorResponse body = new ApiErrorResponse(
                status,
                error,
                message,
                path,
                LocalDateTime.now(),
                Map.of()
        );

        objectMapper.writeValue(
                response.getOutputStream(),
                body
        );
    }
}