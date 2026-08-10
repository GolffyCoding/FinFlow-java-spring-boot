package com.finflow.transaction.event;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.finflow.shared.event.TransactionCreatedEvent;
import com.finflow.transaction.entity.Transaction;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

@Component
public class TransactionEventProducer {
    private final KafkaTemplate<String, String> kafkaTemplate;
    private final ObjectMapper objectMapper;
    private static final String TOPIC = "transaction-events";

    public TransactionEventProducer(KafkaTemplate<String, String> kafkaTemplate, ObjectMapper objectMapper) {
        this.kafkaTemplate = kafkaTemplate;
        this.objectMapper = objectMapper;
    }

    public void publishTransactionCreated(Transaction transaction, Integer velocity) {
        try {
            TransactionCreatedEvent event = new TransactionCreatedEvent();
            event.setTransactionId(transaction.getTransactionId());
            event.setFromAccount(transaction.getFromAccount());
            event.setToAccount(transaction.getToAccount());
            event.setAmount(transaction.getAmount());
            event.setCurrency(transaction.getCurrency());
            event.setTransactionType(transaction.getTransactionType().name());
            event.setStatus(transaction.getStatus().name());
            event.setTimestamp(transaction.getCreatedAt());
            event.setMerchant(transaction.getMerchant());
            event.setCountry(transaction.getCountry());
            event.setHour(transaction.getCreatedAt().getHour());
            event.setVelocity(velocity);

            String payload = objectMapper.writeValueAsString(event);
            kafkaTemplate.send(TOPIC, transaction.getTransactionId(), payload)
                .whenComplete((result, ex) -> {
                    if (ex != null) {
                        System.err.println("Failed to send event: " + ex.getMessage());
                    } else {
                        System.out.println("Event sent to partition " + result.getRecordMetadata().partition());
                    }
                });
        } catch (Exception e) {
            throw new RuntimeException("Failed to publish event", e);
        }
    }
}
