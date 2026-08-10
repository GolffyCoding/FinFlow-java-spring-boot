CREATE SEQUENCE user_sequence START WITH 1 INCREMENT BY 1;

CREATE TABLE users (
    id BIGINT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    created_at DATETIME2,
    updated_at DATETIME2,
    last_login DATETIME2,
    failed_attempts INT DEFAULT 0,
    locked BIT DEFAULT 0
);

CREATE TABLE user_roles (
    user_id BIGINT NOT NULL,
    role VARCHAR(20) NOT NULL,
    PRIMARY KEY (user_id, role),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE refresh_tokens (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    token VARCHAR(255) NOT NULL UNIQUE,
    user_id BIGINT NOT NULL,
    expiry_date DATETIME2 NOT NULL,
    revoked BIT DEFAULT 0
);

INSERT INTO users (id, username, password, email, created_at, updated_at)
VALUES (NEXT VALUE FOR user_sequence, 'admin', '$2b$12$WIwHcee/neNyenrdZz6mA.EdIOvRMLxCccMaMhesdl.Hj49.SqFa2', 'admin@finflow.com', SYSUTCDATETIME(), SYSUTCDATETIME());

INSERT INTO user_roles (user_id, role) VALUES (1, 'ADMIN');
INSERT INTO user_roles (user_id, role) VALUES (1, 'OPERATOR');
