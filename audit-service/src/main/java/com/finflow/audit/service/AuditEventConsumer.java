package com.finflow.audit.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.finflow.audit.entity.AuditLog;
import com.finflow.audit.repository.AuditLogRepository;
import com.finflow.shared.event.TransactionCreatedEvent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuditEventConsumer {
    private static final Logger log = LoggerFactory.getLogger(AuditEventConsumer.class);

    private final AuditLogRepository auditLogRepository;
    private final ObjectMapper objectMapper;

    public AuditEventConsumer(AuditLogRepository auditLogRepository, ObjectMapper objectMapper) {
        this.auditLogRepository = auditLogRepository;
        this.objectMapper = objectMapper;
    }

    @KafkaListener(topics = "transaction-events", groupId = "audit-log-group")
    @Transactional
    public void consumeTransactionEvent(String message) {
        try {
            TransactionCreatedEvent event = objectMapper.readValue(message, TransactionCreatedEvent.class);

            AuditLog entry = new AuditLog();
            entry.setEventType(event.getEventType());
            entry.setTransactionId(event.getTransactionId());
            entry.setFromAccount(event.getFromAccount());
            entry.setToAccount(event.getToAccount());
            entry.setAmount(event.getAmount());
            entry.setCurrency(event.getCurrency());
            entry.setStatus(event.getStatus());
            entry.setActor("SYSTEM");
            entry.setPayload(message.length() > 4000 ? message.substring(0, 4000) : message);
            auditLogRepository.save(entry);
        } catch (Exception e) {
            log.error("Failed to record audit log for message: {}", message, e);
        }
    }
}
