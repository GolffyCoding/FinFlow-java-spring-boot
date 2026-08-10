package com.finflow.fraud.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public class FraudCheckResponse {
    @JsonProperty("fraud_score")
    private Double fraudScore;
    @JsonProperty("fraud_level")
    private String fraudLevel;
    private String reason;
    private Boolean blocked;
    public Double getFraudScore() { return fraudScore; }
    public void setFraudScore(Double fraudScore) { this.fraudScore = fraudScore; }
    public String getFraudLevel() { return fraudLevel; }
    public void setFraudLevel(String fraudLevel) { this.fraudLevel = fraudLevel; }
    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }
    public Boolean getBlocked() { return blocked; }
    public void setBlocked(Boolean blocked) { this.blocked = blocked; }
}
