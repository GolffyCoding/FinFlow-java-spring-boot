package com.finflow.notification.service;

import com.finflow.notification.entity.Notification;
import com.finflow.notification.entity.NotificationStatus;
import com.finflow.notification.repository.NotificationRepository;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
public class EmailService {
    private final JavaMailSender mailSender;
    private final NotificationRepository notificationRepository;

    public EmailService(JavaMailSender mailSender, NotificationRepository notificationRepository) {
        this.mailSender = mailSender;
        this.notificationRepository = notificationRepository;
    }

    @Async("notificationExecutor")
    public void sendEmailAsync(Notification notification) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(notification.getRecipient() + "@finflow.com");
            message.setSubject(notification.getSubject());
            message.setText(notification.getContent());
            mailSender.send(message);

            notification.setStatus(NotificationStatus.SENT);
            notification.setSentAt(LocalDateTime.now());
        } catch (Exception e) {
            notification.setStatus(NotificationStatus.FAILED);
            System.err.println("Failed to send email: " + e.getMessage());
        }
        notificationRepository.save(notification);
    }
}
