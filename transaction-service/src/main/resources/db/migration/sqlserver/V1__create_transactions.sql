CREATE SEQUENCE transaction_sequence START WITH 1 INCREMENT BY 1;

CREATE TABLE transactions (
    id BIGINT PRIMARY KEY,
    transaction_id VARCHAR(20) NOT NULL UNIQUE,
    from_account VARCHAR(20) NOT NULL,
    to_account VARCHAR(20) NOT NULL,
    amount DECIMAL(19,4) NOT NULL,
    currency VARCHAR(3) NOT NULL,
    transaction_type VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL,
    description VARCHAR(255),
    merchant VARCHAR(100),
    country VARCHAR(2),
    created_at DATETIME2,
    updated_at DATETIME2,
    fraud_score FLOAT,
    fraud_level VARCHAR(20)
);
