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

    private FraudCheckResponse fallbackScoring(FraudCheckRequest request) {
        double score = 0.0;
        StringBuilder reason = new StringBuilder();

        if (request.getAmount() != null && request.getAmount().doubleValue() > 100000) {
            score += 0.3;
            reason.append("High amount; ");
        }
        if (request.getHour() != null && (request.getHour() < 6 || request.getHour() > 23)) {
            score += 0.25;
            reason.append("Unusual hour; ");
        }
        if (request.getVelocity() != null && request.getVelocity() > 5) {
            score += 0.2;
            reason.append("High velocity; ");
        }
        if (request.getMerchant() != null && "UNKNOWN".equals(request.getMerchant())) {
            score += 0.15;
            reason.append("Unknown merchant; ");
        }

        FraudCheckResponse resp = new FraudCheckResponse();
        resp.setFraudScore(Math.min(score, 1.0));
        resp.setFraudLevel(score > 0.8 ? "CRITICAL" : score > 0.6 ? "HIGH" : score > 0.3 ? "MEDIUM" : "LOW");
        resp.setReason(reason.toString());
        resp.setBlocked(score > 0.8);
        return resp;
    }
}
