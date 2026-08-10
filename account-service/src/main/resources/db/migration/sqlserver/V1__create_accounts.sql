CREATE SEQUENCE account_sequence START WITH 1 INCREMENT BY 1;

CREATE TABLE accounts (
    id BIGINT PRIMARY KEY,
    account_number VARCHAR(20) NOT NULL UNIQUE,
    account_holder_name VARCHAR(100) NOT NULL,
    balance DECIMAL(19,4) NOT NULL DEFAULT 0,
    currency VARCHAR(3) NOT NULL,
    status VARCHAR(20) NOT NULL,
    account_type VARCHAR(20) NOT NULL,
    version BIGINT DEFAULT 0,
    created_at DATETIME2,
    updated_at DATETIME2,
    user_id BIGINT
);

INSERT INTO accounts (id, account_number, account_holder_name, balance, currency, status, account_type, created_at, updated_at, user_id)
VALUES (NEXT VALUE FOR account_sequence, 'ACC-001-0001', 'John Doe', 1000000.00, 'THB', 'ACTIVE', 'SAVINGS', SYSUTCDATETIME(), SYSUTCDATETIME(), 1);

INSERT INTO accounts (id, account_number, account_holder_name, balance, currency, status, account_type, created_at, updated_at, user_id)
VALUES (NEXT VALUE FOR account_sequence, 'ACC-001-0002', 'Jane Smith', 500000.00, 'THB', 'ACTIVE', 'CURRENT', SYSUTCDATETIME(), SYSUTCDATETIME(), 2);
