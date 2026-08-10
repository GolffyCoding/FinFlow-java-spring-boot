package com.finflow.transaction.service;

import com.finflow.shared.dto.AmountRequest;
import com.finflow.shared.dto.TransferRequest;
import com.finflow.shared.dto.TransferResult;
import com.finflow.shared.exception.BadRequestException;
import com.finflow.shared.exception.NotFoundException;
import com.finflow.transaction.client.AccountClient;
import com.finflow.transaction.entity.Transaction;
import com.finflow.transaction.entity.TransactionStatus;
import com.finflow.transaction.entity.TransactionType;
import com.finflow.transaction.event.TransactionEventProducer;
import com.finflow.transaction.repository.TransactionRepository;
import feign.FeignException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;

@Service
public class TransactionService {
    private final TransactionRepository transactionRepository;
    private final AccountClient accountClient;
    private final TransactionEventProducer eventProducer;

    public TransactionService(TransactionRepository transactionRepository, AccountClient accountClient,
                              TransactionEventProducer eventProducer) {
        this.transactionRepository = transactionRepository;
        this.accountClient = accountClient;
        this.eventProducer = eventProducer;
    }

    @Transactional
    public TransferResult processTransfer(TransferRequest request) {
        String txId = "TX-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();

        Transaction transaction = new Transaction();
        transaction.setTransactionId(txId);
        transaction.setFromAccount(request.getFromAccount());
        transaction.setToAccount(request.getToAccount());
        transaction.setAmount(request.getAmount());
        transaction.setCurrency(request.getCurrency());
        transaction.setTransactionType(TransactionType.TRANSFER);
        transaction.setStatus(TransactionStatus.PENDING);
        transaction.setDescription(request.getDescription());
        transaction.setMerchant("INTERNAL");
        transaction.setCountry("TH");
        transactionRepository.save(transaction);

        try {
            TransferResult result = accountClient.transfer(request);

            if ("COMPLETED".equals(result.getStatus())) {
                transaction.setStatus(TransactionStatus.COMPLETED);
            } else {
                transaction.setStatus(TransactionStatus.FAILED);
            }
            transactionRepository.save(transaction);

            Integer velocity = countRecentTransactions(request.getFromAccount());
            eventProducer.publishTransactionCreated(transaction, velocity);

            // Return this service's own transaction ID (the one actually stored/audited here),
            // not account-service's internally-generated ID for the same operation.
            result.setTransactionId(txId);
            return result;
        } catch (FeignException.BadRequest e) {
            transaction.setStatus(TransactionStatus.FAILED);
            transactionRepository.save(transaction);
            throw new BadRequestException("Transfer failed: " + e.contentUTF8());
        } catch (Exception e) {
            transaction.setStatus(TransactionStatus.FAILED);
            transactionRepository.save(transaction);
            throw new RuntimeException("Transfer failed: " + e.getMessage(), e);
        }
    }

    @Transactional
    public TransferResult processDeposit(AmountRequest request) {
        return processAmountOperation(request, TransactionType.DEPOSIT, accountClient::deposit,
            "SYSTEM", request.getAccountNumber(), "SYSTEM", "Deposit failed");
    }

    @Transactional
    public TransferResult processWithdrawal(AmountRequest request) {
        String destination = request.getMerchant() != null ? request.getMerchant() : "CASH";
        return processAmountOperation(request, TransactionType.WITHDRAW, accountClient::withdraw,
            request.getAccountNumber(), destination, "ATM", "Withdrawal failed");
    }

    @Transactional
    public TransferResult processPayment(AmountRequest request) {
        if (request.getMerchant() == null || request.getMerchant().isBlank()) {
            throw new BadRequestException("Merchant is required for payment");
        }
        return processAmountOperation(request, TransactionType.PAYMENT, accountClient::withdraw,
            request.getAccountNumber(), request.getMerchant(), request.getMerchant(), "Payment failed");
    }

    @Transactional
    public TransferResult processRefund(AmountRequest request) {
        String source = request.getMerchant() != null ? request.getMerchant() : "MERCHANT";
        return processAmountOperation(request, TransactionType.REFUND, accountClient::deposit,
            source, request.getAccountNumber(), source, "Refund failed");
    }

    private TransferResult processAmountOperation(AmountRequest request, TransactionType type,
                                                   Function<AmountRequest, TransferResult> accountOperation,
                                                   String fromAccount, String toAccount, String merchant,
                                                   String failureMessage) {
        String txId = "TX-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();

        Transaction transaction = new Transaction();
        transaction.setTransactionId(txId);
        transaction.setFromAccount(fromAccount);
        transaction.setToAccount(toAccount);
        transaction.setAmount(request.getAmount());
        transaction.setCurrency(request.getCurrency());
        transaction.setTransactionType(type);
        transaction.setStatus(TransactionStatus.PENDING);
        transaction.setMerchant(merchant);
        transaction.setCountry("TH");
        transactionRepository.save(transaction);

        try {
            TransferResult result = accountOperation.apply(request);

            transaction.setStatus("COMPLETED".equals(result.getStatus()) ? TransactionStatus.COMPLETED : TransactionStatus.FAILED);
            transactionRepository.save(transaction);

            Integer velocity = countRecentTransactions(request.getAccountNumber());
            eventProducer.publishTransactionCreated(transaction, velocity);

            result.setTransactionId(txId);
            result.setFromAccount(fromAccount);
            result.setToAccount(toAccount);
            result.setMessage(type.name() + " completed successfully");
            return result;
        } catch (FeignException.BadRequest e) {
            transaction.setStatus(TransactionStatus.FAILED);
            transactionRepository.save(transaction);
            throw new BadRequestException(failureMessage + ": " + e.contentUTF8());
        } catch (Exception e) {
            transaction.setStatus(TransactionStatus.FAILED);
            transactionRepository.save(transaction);
            throw new RuntimeException(failureMessage + ": " + e.getMessage(), e);
        }
    }

    @Transactional(readOnly = true)
    public Transaction getTransaction(String transactionId) {
        return transactionRepository.findByTransactionId(transactionId)
            .orElseThrow(() -> new NotFoundException("Transaction not found"));
    }

    @Transactional(readOnly = true)
    public Page<Transaction> getAllTransactions(Pageable pageable) {
        return transactionRepository.findAll(pageable);
    }

    public Page<Transaction> getAllTransactions(TransactionStatus status, Pageable pageable) {
        if (status == null) {
            return transactionRepository.findAll(pageable);
        }
        return transactionRepository.findByStatus(status, pageable);
    }

    @Transactional(readOnly = true)
    public Page<Transaction> getAccountTransactions(String accountNumber, Pageable pageable) {
        return transactionRepository.findByFromAccountOrToAccount(accountNumber, accountNumber, pageable);
    }

    @Transactional(readOnly = true)
    public Long getTodayTransactionCount() {
        return transactionRepository.countSince(LocalDateTime.now().toLocalDate().atStartOfDay());
    }

    @Transactional(readOnly = true)
    public BigDecimal getTodayTransactionVolume() {
        BigDecimal volume = transactionRepository.sumCompletedSince(LocalDateTime.now().toLocalDate().atStartOfDay());
        return volume != null ? volume : BigDecimal.ZERO;
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getDailyStats(int days) {
        LocalDateTime since = LocalDateTime.now().toLocalDate().minusDays(days - 1L).atStartOfDay();
        List<Transaction> transactions = transactionRepository.findCompletedSince(since);

        Map<LocalDate, BigDecimal> volumeByDay = new LinkedHashMap<>();
        Map<LocalDate, Long> countByDay = new LinkedHashMap<>();
        for (int i = days - 1; i >= 0; i--) {
            LocalDate day = LocalDate.now().minusDays(i);
            volumeByDay.put(day, BigDecimal.ZERO);
            countByDay.put(day, 0L);
        }

        for (Transaction t : transactions) {
            LocalDate day = t.getCreatedAt().toLocalDate();
            if (volumeByDay.containsKey(day)) {
                volumeByDay.merge(day, t.getAmount(), BigDecimal::add);
                countByDay.merge(day, 1L, Long::sum);
            }
        }

        List<Map<String, Object>> result = new ArrayList<>();
        for (LocalDate day : volumeByDay.keySet()) {
            Map<String, Object> entry = new LinkedHashMap<>();
            entry.put("date", day.toString());
            entry.put("volume", volumeByDay.get(day));
            entry.put("count", countByDay.get(day));
            result.add(entry);
        }
        return result;
    }

    private Integer countRecentTransactions(String accountNumber) {
        LocalDateTime oneHourAgo = LocalDateTime.now().minusHours(1);
        return transactionRepository.findRecentByStatus(TransactionStatus.COMPLETED, oneHourAgo)
            .stream()
            .filter(t -> accountNumber.equals(t.getFromAccount()))
            .toList()
            .size();
    }
}
