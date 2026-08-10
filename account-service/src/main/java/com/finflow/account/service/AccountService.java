package com.finflow.account.service;

import com.finflow.account.entity.Account;
import com.finflow.account.entity.AccountStatus;
import com.finflow.account.entity.AccountType;
import com.finflow.account.repository.AccountRepository;
import com.finflow.shared.dto.AccountDto;
import com.finflow.shared.dto.AmountRequest;
import com.finflow.shared.dto.TransferRequest;
import com.finflow.shared.dto.TransferResult;
import com.finflow.shared.exception.BadRequestException;
import com.finflow.shared.exception.InsufficientBalanceException;
import com.finflow.shared.exception.NotFoundException;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

@Service
public class AccountService {
    private final AccountRepository accountRepository;
    private final StringRedisTemplate redisTemplate;

    public AccountService(AccountRepository accountRepository, StringRedisTemplate redisTemplate) {
        this.accountRepository = accountRepository;
        this.redisTemplate = redisTemplate;
    }

    @Transactional(readOnly = true)
    public List<AccountDto> getAllAccounts() {
        return accountRepository.findAll().stream()
            .map(this::mapToDto)
            .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public AccountDto getAccount(Long id) {
        Account account = accountRepository.findById(id)
            .orElseThrow(() -> new NotFoundException("Account not found"));
        return mapToDto(account);
    }

    @Transactional(readOnly = true)
    public AccountDto getAccountByNumber(String accountNumber) {
        Account account = accountRepository.findByAccountNumber(accountNumber)
            .orElseThrow(() -> new NotFoundException("Account not found"));
        return mapToDto(account);
    }

    @Transactional(readOnly = true)
    public BigDecimal getBalance(Long id) {
        Account account = accountRepository.findById(id)
            .orElseThrow(() -> new NotFoundException("Account not found"));
        return account.getBalance();
    }

    @Transactional
    public AccountDto createAccount(AccountDto dto) {
        if (accountRepository.existsByAccountNumber(dto.getAccountNumber())) {
            throw new BadRequestException("Account number already exists");
        }
        Account account = new Account();
        account.setAccountNumber(dto.getAccountNumber());
        account.setAccountHolderName(dto.getAccountHolderName());
        account.setBalance(BigDecimal.ZERO);
        account.setCurrency(dto.getCurrency());
        account.setStatus(AccountStatus.ACTIVE);
        account.setAccountType(AccountType.valueOf(dto.getAccountType()));
        account.setUserId(dto.getId());
        Account saved = accountRepository.save(account);
        return mapToDto(saved);
    }

    @Transactional
    public void freezeAccount(Long id) {
        Account account = accountRepository.findById(id)
            .orElseThrow(() -> new NotFoundException("Account not found"));
        account.setStatus(AccountStatus.FROZEN);
        accountRepository.save(account);
    }

    @Transactional
    public void unfreezeAccount(Long id) {
        Account account = accountRepository.findById(id)
            .orElseThrow(() -> new NotFoundException("Account not found"));
        account.setStatus(AccountStatus.ACTIVE);
        accountRepository.save(account);
    }

    @Transactional
    public TransferResult transfer(TransferRequest request) {
        String idempotencyKey = request.getIdempotencyKey();
        if (idempotencyKey != null && !idempotencyKey.isEmpty()) {
            String existing = redisTemplate.opsForValue().get("idempotency:" + idempotencyKey);
            if (existing != null) {
                TransferResult cached = new TransferResult();
                cached.setTransactionId(existing);
                cached.setStatus("COMPLETED");
                cached.setMessage("Duplicate request - transaction already processed");
                return cached;
            }
        }

        Account fromAccount = accountRepository.findByAccountNumberForUpdate(request.getFromAccount())
            .orElseThrow(() -> new NotFoundException("Source account not found"));
        Account toAccount = accountRepository.findByAccountNumberForUpdate(request.getToAccount())
            .orElseThrow(() -> new NotFoundException("Destination account not found"));

        if (fromAccount.getStatus() != AccountStatus.ACTIVE) {
            throw new BadRequestException("Source account is not active");
        }
        if (toAccount.getStatus() != AccountStatus.ACTIVE) {
            throw new BadRequestException("Destination account is not active");
        }
        if (!fromAccount.getCurrency().equals(request.getCurrency()) || !toAccount.getCurrency().equals(request.getCurrency())) {
            throw new BadRequestException("Currency mismatch");
        }
        if (fromAccount.getBalance().compareTo(request.getAmount()) < 0) {
            throw new InsufficientBalanceException("Insufficient balance in account " + request.getFromAccount());
        }

        fromAccount.setBalance(fromAccount.getBalance().subtract(request.getAmount()));
        toAccount.setBalance(toAccount.getBalance().add(request.getAmount()));
        accountRepository.save(fromAccount);
        accountRepository.save(toAccount);

        String transactionId = "TX-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();

        if (idempotencyKey != null && !idempotencyKey.isEmpty()) {
            redisTemplate.opsForValue().set("idempotency:" + idempotencyKey, transactionId, 24, TimeUnit.HOURS);
        }

        TransferResult result = new TransferResult();
        result.setTransactionId(transactionId);
        result.setStatus("COMPLETED");
        result.setAmount(request.getAmount());
        result.setCurrency(request.getCurrency());
        result.setFromAccount(request.getFromAccount());
        result.setToAccount(request.getToAccount());
        result.setTimestamp(LocalDateTime.now());
        result.setMessage("Transfer completed successfully");
        return result;
    }

    @Transactional
    public TransferResult deposit(AmountRequest request) {
        String idempotencyKey = request.getIdempotencyKey();
        if (idempotencyKey != null && !idempotencyKey.isEmpty()) {
            String existing = redisTemplate.opsForValue().get("idempotency:" + idempotencyKey);
            if (existing != null) {
                return duplicateResult(existing);
            }
        }

        Account account = accountRepository.findByAccountNumberForUpdate(request.getAccountNumber())
            .orElseThrow(() -> new NotFoundException("Account not found"));
        if (account.getStatus() != AccountStatus.ACTIVE) {
            throw new BadRequestException("Account is not active");
        }
        if (!account.getCurrency().equals(request.getCurrency())) {
            throw new BadRequestException("Currency mismatch");
        }

        account.setBalance(account.getBalance().add(request.getAmount()));
        accountRepository.save(account);

        String transactionId = "TX-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        if (idempotencyKey != null && !idempotencyKey.isEmpty()) {
            redisTemplate.opsForValue().set("idempotency:" + idempotencyKey, transactionId, 24, TimeUnit.HOURS);
        }

        return buildResult(transactionId, request, "SYSTEM", request.getAccountNumber(), "Deposit completed successfully");
    }

    @Transactional
    public TransferResult withdraw(AmountRequest request) {
        String idempotencyKey = request.getIdempotencyKey();
        if (idempotencyKey != null && !idempotencyKey.isEmpty()) {
            String existing = redisTemplate.opsForValue().get("idempotency:" + idempotencyKey);
            if (existing != null) {
                return duplicateResult(existing);
            }
        }

        Account account = accountRepository.findByAccountNumberForUpdate(request.getAccountNumber())
            .orElseThrow(() -> new NotFoundException("Account not found"));
        if (account.getStatus() != AccountStatus.ACTIVE) {
            throw new BadRequestException("Account is not active");
        }
        if (!account.getCurrency().equals(request.getCurrency())) {
            throw new BadRequestException("Currency mismatch");
        }
        if (account.getBalance().compareTo(request.getAmount()) < 0) {
            throw new InsufficientBalanceException("Insufficient balance in account " + request.getAccountNumber());
        }

        account.setBalance(account.getBalance().subtract(request.getAmount()));
        accountRepository.save(account);

        String transactionId = "TX-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        if (idempotencyKey != null && !idempotencyKey.isEmpty()) {
            redisTemplate.opsForValue().set("idempotency:" + idempotencyKey, transactionId, 24, TimeUnit.HOURS);
        }

        String destination = request.getMerchant() != null ? request.getMerchant() : "CASH";
        return buildResult(transactionId, request, request.getAccountNumber(), destination, "Withdrawal completed successfully");
    }

    private TransferResult duplicateResult(String existingTransactionId) {
        TransferResult cached = new TransferResult();
        cached.setTransactionId(existingTransactionId);
        cached.setStatus("COMPLETED");
        cached.setMessage("Duplicate request - transaction already processed");
        return cached;
    }

    private TransferResult buildResult(String transactionId, AmountRequest request, String fromAccount, String toAccount, String message) {
        TransferResult result = new TransferResult();
        result.setTransactionId(transactionId);
        result.setStatus("COMPLETED");
        result.setAmount(request.getAmount());
        result.setCurrency(request.getCurrency());
        result.setFromAccount(fromAccount);
        result.setToAccount(toAccount);
        result.setTimestamp(LocalDateTime.now());
        result.setMessage(message);
        return result;
    }

    private AccountDto mapToDto(Account account) {
        AccountDto dto = new AccountDto();
        dto.setId(account.getId());
        dto.setAccountNumber(account.getAccountNumber());
        dto.setAccountHolderName(account.getAccountHolderName());
        dto.setBalance(account.getBalance());
        dto.setCurrency(account.getCurrency());
        dto.setStatus(account.getStatus().name());
        dto.setAccountType(account.getAccountType().name());
        dto.setCreatedAt(account.getCreatedAt());
        dto.setUpdatedAt(account.getUpdatedAt());
        return dto;
    }
}
