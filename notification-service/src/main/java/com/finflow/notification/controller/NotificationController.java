package com.finflow.notification.controller;

import com.finflow.notification.entity.Notification;
import com.finflow.notification.repository.NotificationRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {
    private final NotificationRepository notificationRepository;
    public NotificationController(NotificationRepository notificationRepository) {
        this.notificationRepository = notificationRepository;
    }
    @GetMapping("/transaction/{transactionId}")
    public ResponseEntity<List<Notification>> getByTransaction(@PathVariable String transactionId) {
        return ResponseEntity.ok(notificationRepository.findByTransactionId(transactionId));
    }
}
