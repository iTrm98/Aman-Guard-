-- Bilingual identity: the login response returns an English display name
-- (nameEn) alongside the Arabic one. Nullable so existing rows are unaffected.
ALTER TABLE auth_users
    ADD COLUMN display_name_en VARCHAR(120);
