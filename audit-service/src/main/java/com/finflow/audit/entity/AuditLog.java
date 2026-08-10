package com.finflow.audit.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "audit_logs")
public class AuditLog {
    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "audit_seq")
    @SequenceGenerator(name = "audit_seq", sequenceName = "audit_sequence", allocationSize = 1)
    private Long id;
    @Column(name = "event_type", nullable = false, length = 50)
    private String eventType;
    @Column(name = "transaction_id", length = 20)
    private String transactionId;
    @Column(name = "from_account", length = 20)
    private String fromAccount;
    @Column(name = "to_account", length = 20)
    private String toAccount;
    @Column(name = "amount", precision = 19, scale = 4)
    private BigDecimal amount;
    @Column(name = "currency", length = 3)
    private String currency;
    @Column(name = "status", length = 20)
    private String status;
    @Column(name = "actor", length = 50)
    private String actor;
    @Column(name = "payload", length = 4000)
    private String payload;
    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getEventType() { return eventType; }
    public void setEventType(String eventType) { this.eventType = eventType; }
    public String getTransactionId() { return transactionId; }
    public void setTransactionId(String transactionId) { this.transactionId = transactionId; }
    public String getFromAccount() { return fromAccount; }
    public void setFromAccount(String fromAccount) { this.fromAccount = fromAccount; }
    public String getToAccount() { return toAccount; }
    public void setToAccount(String toAccount) { this.toAccount = toAccount; }
    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }
    public String getCurrency() { return currency; }
    public void setCurrency(String currency) { this.currency = currency; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getActor() { return actor; }
    public void setActor(String actor) { this.actor = actor; }
    public String getPayload() { return payload; }
    public void setPayload(String payload) { this.payload = payload; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
