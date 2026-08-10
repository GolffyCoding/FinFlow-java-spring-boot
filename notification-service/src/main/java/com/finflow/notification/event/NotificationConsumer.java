package com.finflow.notification.event;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.finflow.notification.entity.Notification;
import com.finflow.notification.entity.NotificationStatus;
import com.finflow.notification.entity.NotificationType;
import com.finflow.notification.repository.NotificationRepository;
import com.finflow.notification.service.EmailService;
import com.finflow.shared.event.TransactionCreatedEvent;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class NotificationConsumer {
    private final NotificationRepository notificationRepository;
    private final EmailService emailService;
    private final ObjectMapper objectMapper;

    public NotificationConsumer(NotificationRepository notificationRepository, EmailService emailService,
                                ObjectMapper objectMapper) {
        this.notificationRepository = notificationRepository;
        this.emailService = emailService;
        this.objectMapper = objectMapper;
    }

    @KafkaListener(topics = "transaction-events", groupId = "notification-group")
    @Transactional
    public void consumeTransactionEvent(String message) {
        try {
            TransactionCreatedEvent event = objectMapper.readValue(message, TransactionCreatedEvent.class);

            String content = String.format(
                "Transaction %s of %s %s from %s to %s has been %s",
                event.getTransactionId(),
                event.getAmount(),
                event.getCurrency(),
                event.getFromAccount(),
                event.getToAccount(),
                event.getStatus()
            );

            Notification notification = new Notification();
            notification.setRecipient(event.getFromAccount());
            notification.setSubject("Transaction Notification: " + event.getTransactionId());
            notification.setContent(content);
            notification.setType(NotificationType.EMAIL);
            notification.setStatus(NotificationStatus.PENDING);
            notification.setTransactionId(event.getTransactionId());
            notificationRepository.save(notification);

            // Async email sending
            emailService.sendEmailAsync(notification);

        } catch (Exception e) {
            System.err.println("Error processing notification: " + e.getMessage());
        }
    }
}
