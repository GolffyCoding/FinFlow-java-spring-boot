package com.finflow.fraud.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.finflow.fraud.client.MlModelClient;
import com.finflow.fraud.dto.FraudCheckRequest;
import com.finflow.fraud.dto.FraudCheckResponse;
import com.finflow.fraud.entity.AlertStatus;
import com.finflow.fraud.entity.FraudAlert;
import com.finflow.fraud.repository.FraudAlertRepository;
import com.finflow.shared.event.TransactionCreatedEvent;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class FraudDetectionConsumer {
    private final MlModelClient mlModelClient;
    private final FraudAlertRepository fraudAlertRepository;
    private final ObjectMapper objectMapper;

    public FraudDetectionConsumer(MlModelClient mlModelClient, FraudAlertRepository fraudAlertRepository,
                                  ObjectMapper objectMapper) {
        this.mlModelClient = mlModelClient;
        this.fraudAlertRepository = fraudAlertRepository;
        this.objectMapper = objectMapper;
    }

    @KafkaListener(topics = "transaction-events", groupId = "fraud-detection-group")
    @Transactional
    public void consumeTransactionEvent(String message) {
        try {
            TransactionCreatedEvent event = objectMapper.readValue(message, TransactionCreatedEvent.class);

            FraudCheckRequest request = new FraudCheckRequest();
            request.setAmount(event.getAmount());
            request.setCountry(event.getCountry());
            request.setHour(event.getHour());
            request.setMerchant(event.getMerchant());
            request.setVelocity(event.getVelocity());
            request.setTransactionId(event.getTransactionId());
            request.setFromAccount(event.getFromAccount());
            request.setToAccount(event.getToAccount());

            FraudCheckResponse response = mlModelClient.checkFraud(request);

            if ("HIGH".equals(response.getFraudLevel()) || "CRITICAL".equals(response.getFraudLevel())) {
                FraudAlert alert = new FraudAlert();
                alert.setTransactionId(event.getTransactionId());
                alert.setAmount(event.getAmount());
                alert.setCurrency(event.getCurrency());
                alert.setFraudScore(response.getFraudScore());
                alert.setFraudLevel(response.getFraudLevel());
                alert.setReason(response.getReason());
                alert.setStatus(AlertStatus.OPEN);
                fraudAlertRepository.save(alert);

                System.out.println("🚨 FRAUD ALERT: " + event.getTransactionId() + 
                    " - Score: " + response.getFraudScore() + " - Level: " + response.getFraudLevel());
            }
        } catch (Exception e) {
            System.err.println("Error processing fraud detection: " + e.getMessage());
        }
    }
}
