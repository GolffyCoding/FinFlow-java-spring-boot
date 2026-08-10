CREATE SEQUENCE audit_sequence START WITH 1 INCREMENT BY 1;

CREATE TABLE audit_logs (
    id BIGINT PRIMARY KEY,
    event_type VARCHAR(50) NOT NULL,
    transaction_id VARCHAR(20),
    from_account VARCHAR(20),
    to_account VARCHAR(20),
    amount DECIMAL(19,4),
    currency VARCHAR(3),
    status VARCHAR(20),
    actor VARCHAR(50),
    payload VARCHAR(4000),
    created_at DATETIME2
);

CREATE INDEX idx_audit_logs_transaction_id ON audit_logs(transaction_id);
CREATE INDEX idx_audit_logs_event_type ON audit_logs(event_type);
