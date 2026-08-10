CREATE SEQUENCE notification_sequence START WITH 1 INCREMENT BY 1;

CREATE TABLE notifications (
    id BIGINT PRIMARY KEY,
    recipient VARCHAR(100) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    content VARCHAR(2000) NOT NULL,
    type VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL,
    transaction_id VARCHAR(20),
    created_at DATETIME2,
    sent_at DATETIME2
);
