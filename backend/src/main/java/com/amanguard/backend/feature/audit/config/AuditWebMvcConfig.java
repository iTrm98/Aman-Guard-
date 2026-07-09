package com.amanguard.backend.feature.audit.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class AuditWebMvcConfig implements WebMvcConfigurer {

    private final AuditLogInterceptor auditLogInterceptor;

    public AuditWebMvcConfig(
            AuditLogInterceptor auditLogInterceptor
    ) {
        this.auditLogInterceptor = auditLogInterceptor;
    }

    @Override
    public void addInterceptors(
            InterceptorRegistry registry
    ) {
        registry
                .addInterceptor(auditLogInterceptor)
                .addPathPatterns("/api/**");
    }
}