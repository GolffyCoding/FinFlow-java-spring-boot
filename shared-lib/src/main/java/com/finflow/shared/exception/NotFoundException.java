package com.finflow.shared.exception;

public class NotFoundException extends FinFlowException {
    public NotFoundException(String message) {
        super(message, "NOT_FOUND", 404);
    }
}
