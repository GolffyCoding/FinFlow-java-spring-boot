package com.finflow.fraud.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.math.BigDecimal;

public class FraudCheckRequest {
    private BigDecimal amount;
    private String country;
    private Integer hour;
    private String merchant;
    private Integer velocity;
    @JsonProperty("transaction_id")
    private String transactionId;
    @JsonProperty("from_account")
    private String fromAccount;
    @JsonProperty("to_account")
    private String toAccount;
    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }
    public String getCountry() { return country; }
    public void setCountry(String country) { this.country = country; }
    public Integer getHour() { return hour; }
    public void setHour(Integer hour) { this.hour = hour; }
    public String getMerchant() { return merchant; }
    public void setMerchant(String merchant) { this.merchant = merchant; }
    public Integer getVelocity() { return velocity; }
    public void setVelocity(Integer velocity) { this.velocity = velocity; }
    public String getTransactionId() { return transactionId; }
    public void setTransactionId(String transactionId) { this.transactionId = transactionId; }
    public String getFromAccount() { return fromAccount; }
    public void setFromAccount(String fromAccount) { this.fromAccount = fromAccount; }
    public String getToAccount() { return toAccount; }
    public void setToAccount(String toAccount) { this.toAccount = toAccount; }
}
