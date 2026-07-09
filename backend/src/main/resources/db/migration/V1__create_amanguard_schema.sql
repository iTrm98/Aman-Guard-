CREATE TABLE accounts (
    id BIGINT NOT NULL AUTO_INCREMENT,
    iban VARCHAR(34) NOT NULL,
    masked_iban VARCHAR(40) NOT NULL,
    balance DECIMAL(15, 2) NOT NULL,
    currency VARCHAR(3) NOT NULL,
    status VARCHAR(30) NOT NULL,
    security_status VARCHAR(30) NOT NULL,
    PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE auth_users (
    id BIGINT NOT NULL AUTO_INCREMENT,
    national_id VARCHAR(20) NOT NULL,
    account_number VARCHAR(50) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    display_name VARCHAR(120) NOT NULL,
    role VARCHAR(30) NOT NULL,
    pin_hash VARCHAR(120) NOT NULL,
    refresh_token_hash VARCHAR(200),
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    created_at DATETIME(6) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_auth_users_national_id UNIQUE (national_id),
    CONSTRAINT uk_auth_users_account_number UNIQUE (account_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE auth_otps (
    id BIGINT NOT NULL AUTO_INCREMENT,
    identifier VARCHAR(50) NOT NULL,
    code_hash VARCHAR(120) NOT NULL,
    expires_at DATETIME(6) NOT NULL,
    used BOOLEAN NOT NULL DEFAULT FALSE,
    created_at DATETIME(6) NOT NULL,
    PRIMARY KEY (id),
    INDEX idx_auth_otps_identifier_used_created (identifier, used, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE token_blacklist (
    id BIGINT NOT NULL AUTO_INCREMENT,
    jwt_id VARCHAR(80) NOT NULL,
    expires_at DATETIME(6) NOT NULL,
    created_at DATETIME(6) NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_token_blacklist_jwt_id UNIQUE (jwt_id),
    INDEX idx_token_blacklist_expires_at (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE customers (
    id BIGINT NOT NULL AUTO_INCREMENT,
    national_id VARCHAR(20) NOT NULL,
    name VARCHAR(100) NOT NULL,
    name_en VARCHAR(100) NOT NULL,
    account_number VARCHAR(34) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_customers_national_id UNIQUE (national_id),
    INDEX idx_customers_account_number (account_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE fraud_cases (
    id BIGINT NOT NULL AUTO_INCREMENT,
    input_text VARCHAR(5000) NOT NULL,
    risk_score INT NOT NULL,
    risk_level VARCHAR(30) NOT NULL,
    recommendation VARCHAR(1000) NOT NULL,
    customer_name VARCHAR(100),
    fraud_pattern VARCHAR(200),
    account_number VARCHAR(34),
    phone VARCHAR(20),
    notes VARCHAR(2000),
    account_status_override VARCHAR(30),
    estimated_amount DECIMAL(15, 2),
    created_at DATETIME(6) NOT NULL,
    PRIMARY KEY (id),
    INDEX idx_fraud_cases_risk_level_created_at (risk_level, created_at),
    INDEX idx_fraud_cases_created_at (created_at),
    INDEX idx_fraud_cases_account_number (account_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE freeze_requests (
    id BIGINT NOT NULL AUTO_INCREMENT,
    fraud_case_id BIGINT NOT NULL,
    reason VARCHAR(255) NOT NULL,
    status VARCHAR(30) NOT NULL,
    report_number VARCHAR(30) NOT NULL,
    created_at DATETIME(6) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_freeze_requests_report_number UNIQUE (report_number),
    INDEX idx_freeze_requests_fraud_case_id (fraud_case_id),
    INDEX idx_freeze_requests_status_updated_at (status, updated_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE notifications (
    id BIGINT NOT NULL AUTO_INCREMENT,
    icon VARCHAR(10) NOT NULL,
    title_ar VARCHAR(200) NOT NULL,
    title_en VARCHAR(200) NOT NULL,
    body_ar VARCHAR(500) NOT NULL,
    body_en VARCHAR(500) NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    type VARCHAR(20) NOT NULL,
    case_id BIGINT,
    created_at DATETIME(6) NOT NULL,
    PRIMARY KEY (id),
    INDEX idx_notifications_created_at (created_at),
    INDEX idx_notifications_is_read (is_read),
    INDEX idx_notifications_case_id (case_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE bank_calls (
    id BIGINT NOT NULL AUTO_INCREMENT,
    caller_number VARCHAR(20) NOT NULL,
    caller_name VARCHAR(100) NOT NULL,
    official_call BOOLEAN NOT NULL,
    active BOOLEAN NOT NULL,
    started_at DATETIME(6) NOT NULL,
    PRIMARY KEY (id),
    INDEX idx_bank_calls_number_active_started (caller_number, active, started_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE transaction_analyses (
    id BIGINT NOT NULL AUTO_INCREMENT,
    fraud_case_id BIGINT,
    merchant_name VARCHAR(200) NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    currency VARCHAR(10),
    merchant_url VARCHAR(500),
    transaction_type VARCHAR(50),
    risk_score INT NOT NULL,
    risk_level VARCHAR(30) NOT NULL,
    action VARCHAR(20) NOT NULL,
    resolution VARCHAR(20),
    report_number VARCHAR(30),
    created_at DATETIME(6) NOT NULL,
    PRIMARY KEY (id),
    INDEX idx_transaction_analyses_created_at (created_at),
    INDEX idx_transaction_analyses_fraud_case_id (fraud_case_id),
    INDEX idx_transaction_analyses_merchant_name (merchant_name),
    INDEX idx_transaction_analyses_risk_level (risk_level)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE verification_sessions (
    id BIGINT NOT NULL AUTO_INCREMENT,
    fraud_case_id BIGINT NOT NULL,
    question_one_answer BOOLEAN NOT NULL,
    question_two_answer BOOLEAN NOT NULL,
    question_three_answer BOOLEAN NOT NULL,
    previous_risk_score INT NOT NULL,
    added_risk_score INT NOT NULL,
    final_risk_score INT NOT NULL,
    risk_level VARCHAR(30) NOT NULL,
    recommended_action VARCHAR(50) NOT NULL,
    created_at DATETIME(6) NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_verification_fraud_case UNIQUE (fraud_case_id),
    INDEX idx_verification_sessions_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;