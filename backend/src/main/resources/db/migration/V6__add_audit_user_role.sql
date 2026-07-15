-- The audit interceptor previously recorded bank officers only, so every
-- existing row belongs to an officer — hence the BANK_OFFICER default.
ALTER TABLE audit_logs
    ADD COLUMN user_role VARCHAR(20) NOT NULL DEFAULT 'BANK_OFFICER';
