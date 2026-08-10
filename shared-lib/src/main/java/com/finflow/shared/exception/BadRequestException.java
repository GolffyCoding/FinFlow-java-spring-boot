package com.finflow.shared.exception;

public class BadRequestException extends FinFlowException {
    public BadRequestException(String message) {
        super(message, "BAD_REQUEST", 400);
    }
}
