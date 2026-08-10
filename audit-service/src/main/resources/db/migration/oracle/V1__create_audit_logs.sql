CREATE SEQUENCE audit_sequence START WITH 1 INCREMENT BY 1;

CREATE TABLE audit_logs (
    id NUMBER(19) PRIMARY KEY,
    event_type VARCHAR2(50) NOT NULL,
    transaction_id VARCHAR2(20),
    from_account VARCHAR2(20),
    to_account VARCHAR2(20),
    amount NUMBER(19,4),
    currency VARCHAR2(3),
    status VARCHAR2(20),
    actor VARCHAR2(50),
    payload VARCHAR2(4000),
    created_at TIMESTAMP
);

CREATE INDEX idx_audit_logs_transaction_id ON audit_logs(transaction_id);
CREATE INDEX idx_audit_logs_event_type ON audit_logs(event_type);
