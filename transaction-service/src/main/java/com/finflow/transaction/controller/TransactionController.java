package com.finflow.transaction.controller;

import com.finflow.shared.dto.AmountRequest;
import com.finflow.shared.dto.TransferRequest;
import com.finflow.shared.dto.TransferResult;
import com.finflow.transaction.entity.Transaction;
import com.finflow.transaction.service.TransactionService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/transactions")
public class TransactionController {
    private final TransactionService transactionService;
    public TransactionController(TransactionService transactionService) {
        this.transactionService = transactionService;
    }
    @PostMapping("/transfer")
    public ResponseEntity<TransferResult> transfer(@Valid @RequestBody TransferRequest request) {
        return ResponseEntity.ok(transactionService.processTransfer(request));
    }
    @PostMapping("/deposit")
    public ResponseEntity<TransferResult> deposit(@Valid @RequestBody AmountRequest request) {
        return ResponseEntity.ok(transactionService.processDeposit(request));
    }
    @PostMapping("/withdraw")
    public ResponseEntity<TransferResult> withdraw(@Valid @RequestBody AmountRequest request) {
        return ResponseEntity.ok(transactionService.processWithdrawal(request));
    }
    @PostMapping("/payment")
    public ResponseEntity<TransferResult> payment(@Valid @RequestBody AmountRequest request) {
        return ResponseEntity.ok(transactionService.processPayment(request));
    }
    @PostMapping("/refund")
    public ResponseEntity<TransferResult> refund(@Valid @RequestBody AmountRequest request) {
        return ResponseEntity.ok(transactionService.processRefund(request));
    }
    @GetMapping
    public ResponseEntity<Page<Transaction>> getAllTransactions(
            @RequestParam(required = false) com.finflow.transaction.entity.TransactionStatus status,
            Pageable pageable) {
        return ResponseEntity.ok(transactionService.getAllTransactions(status, pageable));
    }
    @GetMapping("/{transactionId}")
    public ResponseEntity<Transaction> getTransaction(@PathVariable String transactionId) {
        return ResponseEntity.ok(transactionService.getTransaction(transactionId));
    }
    @GetMapping("/account/{accountNumber}")
    public ResponseEntity<Page<Transaction>> getAccountTransactions(@PathVariable String accountNumber, Pageable pageable) {
        return ResponseEntity.ok(transactionService.getAccountTransactions(accountNumber, pageable));
    }
    @GetMapping("/stats/today")
    public ResponseEntity<Map<String, Object>> getTodayStats() {
        return ResponseEntity.ok(Map.of(
            "count", transactionService.getTodayTransactionCount(),
            "volume", transactionService.getTodayTransactionVolume()
        ));
    }
    @GetMapping("/stats/daily")
    public ResponseEntity<java.util.List<Map<String, Object>>> getDailyStats(
            @RequestParam(defaultValue = "7") int days) {
        return ResponseEntity.ok(transactionService.getDailyStats(days));
    }
}
