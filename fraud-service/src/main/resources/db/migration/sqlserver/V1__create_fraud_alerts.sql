CREATE SEQUENCE alert_sequence START WITH 1 INCREMENT BY 1;

CREATE TABLE fraud_alerts (
    id BIGINT PRIMARY KEY,
    transaction_id VARCHAR(20) NOT NULL,
    amount DECIMAL(19,4) NOT NULL,
    currency VARCHAR(3) NOT NULL,
    fraud_score FLOAT NOT NULL,
    fraud_level VARCHAR(20) NOT NULL,
    reason VARCHAR(500),
    status VARCHAR(20) NOT NULL,
    created_at DATETIME2,
    resolved_at DATETIME2,
    resolved_by VARCHAR(50)
);
