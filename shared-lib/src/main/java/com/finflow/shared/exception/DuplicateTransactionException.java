package com.finflow.shared.exception;

public class DuplicateTransactionException extends FinFlowException {
    public DuplicateTransactionException(String message) {
        super(message, "DUPLICATE_TRANSACTION", 409);
    }
}
