package com.finflow.shared.exception;

public class FinFlowException extends RuntimeException {
    private final String errorCode;
    private final int statusCode;
    public FinFlowException(String message, String errorCode, int statusCode) {
        super(message);
        this.errorCode = errorCode;
        this.statusCode = statusCode;
    }
    public String getErrorCode() { return errorCode; }
    public int getStatusCode() { return statusCode; }
}
