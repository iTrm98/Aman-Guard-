-- Per-user notifications. NULL recipient = officer broadcast (SOC alerts);
-- a national id = a single customer's own notifications. Existing rows stay
-- NULL so the officer bell is unchanged.
ALTER TABLE notifications
    ADD COLUMN recipient_national_id VARCHAR(20) NULL;

CREATE INDEX idx_notifications_recipient
    ON notifications (recipient_national_id);

-- Demo customer-facing notifications for national id 1234567890 so the
-- customer bell has content (the seeded SOC notifications are officer-only).
INSERT INTO notifications (
    icon, title_ar, title_en, body_ar, body_en,
    is_read, type, case_id, recipient_national_id, created_at
) VALUES
('✅', 'تم تأمين حسابك', 'Account Secured',
 'تم تفعيل الحماية على حسابك بنجاح.', 'Protection has been enabled on your account.',
 FALSE, 'analysis', NULL, '1234567890', NOW(6) - INTERVAL 15 MINUTE),
('⚠️', 'تنبيه تسجيل دخول', 'Sign-in Alert',
 'رصدنا محاولة دخول غير معتادة وتم إيقافها.', 'We detected and blocked an unusual sign-in attempt.',
 FALSE, 'warning', NULL, '1234567890', NOW(6) - INTERVAL 2 HOUR);
