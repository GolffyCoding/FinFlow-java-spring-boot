CREATE SEQUENCE transaction_sequence START WITH 1 INCREMENT BY 1;

CREATE TABLE transactions (
    id NUMBER(19) PRIMARY KEY,
    transaction_id VARCHAR2(20) NOT NULL UNIQUE,
    from_account VARCHAR2(20) NOT NULL,
    to_account VARCHAR2(20) NOT NULL,
    amount NUMBER(19,4) NOT NULL,
    currency VARCHAR2(3) NOT NULL,
    transaction_type VARCHAR2(20) NOT NULL,
    status VARCHAR2(20) NOT NULL,
    description VARCHAR2(255),
    merchant VARCHAR2(100),
    country VARCHAR2(2),
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    fraud_score FLOAT,
    fraud_level VARCHAR2(20)
);
