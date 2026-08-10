CREATE SEQUENCE alert_sequence START WITH 1 INCREMENT BY 1;

CREATE TABLE fraud_alerts (
    id NUMBER(19) PRIMARY KEY,
    transaction_id VARCHAR2(20) NOT NULL,
    amount NUMBER(19,4) NOT NULL,
    currency VARCHAR2(3) NOT NULL,
    fraud_score FLOAT NOT NULL,
    fraud_level VARCHAR2(20) NOT NULL,
    reason VARCHAR2(500),
    status VARCHAR2(20) NOT NULL,
    created_at TIMESTAMP,
    resolved_at TIMESTAMP,
    resolved_by VARCHAR2(50)
);
