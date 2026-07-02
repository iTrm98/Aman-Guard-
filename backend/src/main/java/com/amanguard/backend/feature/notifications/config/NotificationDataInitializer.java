package com.amanguard.backend.feature.notifications.config;

import com.amanguard.backend.feature.notifications.model.Notification;
import com.amanguard.backend.feature.notifications.repository.NotificationRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.LocalDateTime;

@Configuration
public class NotificationDataInitializer {

    @Bean
    public CommandLineRunner initializeNotifications(
            NotificationRepository notificationRepository
    ) {
        return args -> {
            if (notificationRepository.count() > 0) {
                return;
            }

            LocalDateTime now = LocalDateTime.now();

            // caseIds reference the two FraudCase rows seeded by
            // DashboardDataInitializer (ids 1 and 2).
            notificationRepository.save(new Notification(
                    "🚨",
                    "حالات حرجة اليوم",
                    "Critical Cases Today",
                    "تم رصد حالة احتيال حرجة جديدة — FR-9020",
                    "New critical fraud case detected — FR-9020",
                    false,
                    "warning",
                    2L,
                    now.minusMinutes(2)
            ));

            notificationRepository.save(new Notification(
                    "❄️",
                    "محمي",
                    "Protected",
                    "تم تجميد الحساب SA••4821 بناءً على طلب العميل",
                    "Account SA••4821 frozen at client request",
                    false,
                    "freeze",
                    2L,
                    now.minusMinutes(15)
            ));

            notificationRepository.save(new Notification(
                    "✅",
                    "تقرير تحليل المخاطر",
                    "Risk Analysis Report",
                    "تقرير تحليل المخاطر الأسبوعي متاح الآن",
                    "Weekly risk analysis report is now available",
                    true,
                    "analysis",
                    null,
                    now.minusHours(1)
            ));

            notificationRepository.save(new Notification(
                    "⚠️",
                    "حالات قيد المراقبة",
                    "Cases Under Monitoring",
                    "ارتفعت حالات الاشتباه بنسبة ١٢٪ هذا الأسبوع",
                    "Suspected cases up 12% this week",
                    true,
                    "warning",
                    null,
                    now.minusHours(3)
            ));
        };
    }
}
