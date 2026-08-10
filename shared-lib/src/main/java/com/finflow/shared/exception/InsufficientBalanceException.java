package com.finflow.shared.exception;

public class InsufficientBalanceException extends FinFlowException {
    public InsufficientBalanceException(String message) {
        super(message, "INSUFFICIENT_BALANCE", 400);
    }
}
