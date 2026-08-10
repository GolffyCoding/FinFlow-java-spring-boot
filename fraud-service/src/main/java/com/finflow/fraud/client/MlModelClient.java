package com.finflow.fraud.client;

import com.finflow.fraud.dto.FraudCheckRequest;
import com.finflow.fraud.dto.FraudCheckResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

@Component
public class MlModelClient {
    @Value("${ml.service.url:http://fraud-ml:8000}")
    private String mlServiceUrl;
    private final RestTemplate restTemplate = new RestTemplate();

    public FraudCheckResponse checkFraud(FraudCheckRequest request) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<FraudCheckRequest> entity = new HttpEntity<>(request, headers);
            return restTemplate.postForObject(mlServiceUrl + "/predict", entity, FraudCheckResponse.class);
        } catch (Exception e) {
            // Fallback: rule-based scoring if ML service is down
            return fallbackScoring(request);
        }
    }

    private static final java.util.Set<String> TRUSTED_COUNTRIES =
        java.util.Set.of("TH", "US", "SG", "JP", "GB", "AU");
    private static final java.util.Set<String> HIGH_RISK_TYPES =
        java.util.Set.of("WITHDRAW", "PAYMENT");

    /**
     * Same signal family as fraud-ml's rule-based mode, kept independently so the gateway
     * degrades gracefully (same shape of decisions) if fraud-ml itself is unreachable.
     */
    private FraudCheckResponse fallbackScoring(FraudCheckRequest request) {
        double score = 0.0;
        java.util.List<String> reasons = new java.util.ArrayList<>();

        double amount = request.getAmount() != null ? request.getAmount().doubleValue() : 0.0;
        int velocity = request.getVelocity() != null ? request.getVelocity() : 0;

        if (amount > 100000) {
            score += 0.3;
            reasons.add("High transaction amount");
        }
        if (request.getHour() != null && (request.getHour() < 6 || request.getHour() > 23)) {
            score += 0.2;
            reasons.add("Unusual transaction hour");
        }
        if (velocity > 5) {
            score += 0.2;
            reasons.add("High transaction velocity");
        }
        if (request.getMerchant() != null && "UNKNOWN".equals(request.getMerchant())) {
            score += 0.15;
            reasons.add("Unknown merchant");
        }
        if (request.getCountry() != null && !TRUSTED_COUNTRIES.contains(request.getCountry())) {
            score += 0.1;
            reasons.add("Uncommon country");
        }
        if (amount > 1000 && amount % 1000 == 0 && velocity > 3 && amount > 5000) {
            score += 0.3;
            reasons.add("Repeated round-number amounts at elevated velocity (possible structuring)");
        } else if (amount > 1000 && amount % 1000 == 0) {
            score += 0.1;
            reasons.add("Round-number amount (possible structuring)");
        }
        if (request.getDayOfWeek() != null && request.getDayOfWeek() >= 6) {
            score += 0.05;
            reasons.add("Weekend transaction");
        }
        if (request.getTransactionType() != null && HIGH_RISK_TYPES.contains(request.getTransactionType())
                && velocity > 3) {
            score += 0.1;
            reasons.add("Rapid " + request.getTransactionType().toLowerCase() + " activity");
        }

        score = Math.min(score, 1.0);
        FraudCheckResponse resp = new FraudCheckResponse();
        resp.setFraudScore(score);
        resp.setFraudLevel(score > 0.8 ? "CRITICAL" : score > 0.6 ? "HIGH" : score > 0.3 ? "MEDIUM" : "LOW");
        resp.setReason(reasons.isEmpty() ? "Normal transaction pattern" : String.join("; ", reasons));
        resp.setBlocked(score > 0.8);
        return resp;
    }
}
