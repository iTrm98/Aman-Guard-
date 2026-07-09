CREATE TABLE audit_logs (
    id BIGINT NOT NULL AUTO_INCREMENT,
    officer_id VARCHAR(50) NOT NULL,
    action VARCHAR(120) NOT NULL,
    http_method VARCHAR(10) NOT NULL,
    path VARCHAR(500) NOT NULL,
    query_string VARCHAR(1000),
    status_code INT NOT NULL,
    ip_address VARCHAR(80),
    user_agent VARCHAR(500),
    created_at DATETIME(6) NOT NULL,
    PRIMARY KEY (id),
    INDEX idx_audit_logs_officer_created (officer_id, created_at),
    INDEX idx_audit_logs_action_created (action, created_at),
    INDEX idx_audit_logs_status_created (status_code, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;