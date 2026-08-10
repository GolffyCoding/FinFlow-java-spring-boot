CREATE SEQUENCE account_sequence START WITH 1 INCREMENT BY 1;

CREATE TABLE accounts (
    id NUMBER(19) PRIMARY KEY,
    account_number VARCHAR2(20) NOT NULL UNIQUE,
    account_holder_name VARCHAR2(100) NOT NULL,
    balance NUMBER(19,4) DEFAULT 0 NOT NULL,
    currency VARCHAR2(3) NOT NULL,
    status VARCHAR2(20) NOT NULL,
    account_type VARCHAR2(20) NOT NULL,
    version NUMBER(19) DEFAULT 0,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    user_id NUMBER(19)
);

INSERT INTO accounts (id, account_number, account_holder_name, balance, currency, status, account_type, created_at, updated_at, user_id)
VALUES (account_sequence.NEXTVAL, 'ACC-001-0001', 'John Doe', 1000000.00, 'THB', 'ACTIVE', 'SAVINGS', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 1);

INSERT INTO accounts (id, account_number, account_holder_name, balance, currency, status, account_type, created_at, updated_at, user_id)
VALUES (account_sequence.NEXTVAL, 'ACC-001-0002', 'Jane Smith', 500000.00, 'THB', 'ACTIVE', 'CURRENT', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 2);
