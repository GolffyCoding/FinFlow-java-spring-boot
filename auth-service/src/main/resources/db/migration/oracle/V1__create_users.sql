CREATE SEQUENCE user_sequence START WITH 1 INCREMENT BY 1;

CREATE TABLE users (
    id NUMBER(19) PRIMARY KEY,
    username VARCHAR2(50) NOT NULL UNIQUE,
    password VARCHAR2(255) NOT NULL,
    email VARCHAR2(100) NOT NULL UNIQUE,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    last_login TIMESTAMP,
    failed_attempts NUMBER(5) DEFAULT 0,
    locked NUMBER(1) DEFAULT 0
);

CREATE TABLE user_roles (
    user_id NUMBER(19) NOT NULL,
    role VARCHAR2(20) NOT NULL,
    PRIMARY KEY (user_id, role),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE refresh_tokens (
    id NUMBER(19) GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    token VARCHAR2(255) NOT NULL UNIQUE,
    user_id NUMBER(19) NOT NULL,
    expiry_date TIMESTAMP NOT NULL,
    revoked NUMBER(1) DEFAULT 0
);

INSERT INTO users (id, username, password, email, created_at, updated_at)
VALUES (user_sequence.NEXTVAL, 'admin', '$2b$12$WIwHcee/neNyenrdZz6mA.EdIOvRMLxCccMaMhesdl.Hj49.SqFa2', 'admin@finflow.com', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT INTO user_roles (user_id, role) VALUES (1, 'ADMIN');
INSERT INTO user_roles (user_id, role) VALUES (1, 'OPERATOR');
