CREATE SEQUENCE notification_sequence START WITH 1 INCREMENT BY 1;

CREATE TABLE notifications (
    id NUMBER(19) PRIMARY KEY,
    recipient VARCHAR2(100) NOT NULL,
    subject VARCHAR2(255) NOT NULL,
    content VARCHAR2(2000) NOT NULL,
    type VARCHAR2(20) NOT NULL,
    status VARCHAR2(20) NOT NULL,
    transaction_id VARCHAR2(20),
    created_at TIMESTAMP,
    sent_at TIMESTAMP
);
