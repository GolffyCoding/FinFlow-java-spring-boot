package com.finflow.account.controller;

import com.finflow.account.service.AccountService;
import com.finflow.shared.dto.AccountDto;
import com.finflow.shared.dto.AmountRequest;
import com.finflow.shared.dto.TransferRequest;
import com.finflow.shared.dto.TransferResult;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/accounts")
public class AccountController {
    private final AccountService accountService;
    public AccountController(AccountService accountService) {
        this.accountService = accountService;
    }
    @GetMapping
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN','ROLE_OPERATOR','ROLE_AUDITOR')")
    public ResponseEntity<List<AccountDto>> getAllAccounts() {
        return ResponseEntity.ok(accountService.getAllAccounts());
    }
    @PostMapping
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN','ROLE_OPERATOR')")
    public ResponseEntity<AccountDto> createAccount(@Valid @RequestBody AccountDto dto) {
        return ResponseEntity.ok(accountService.createAccount(dto));
    }
    @GetMapping("/{id}")
    public ResponseEntity<AccountDto> getAccount(@PathVariable Long id) {
        return ResponseEntity.ok(accountService.getAccount(id));
    }
    @GetMapping("/number/{accountNumber}")
    public ResponseEntity<AccountDto> getAccountByNumber(@PathVariable String accountNumber) {
        return ResponseEntity.ok(accountService.getAccountByNumber(accountNumber));
    }
    @GetMapping("/{id}/balance")
    public ResponseEntity<BigDecimal> getBalance(@PathVariable Long id) {
        return ResponseEntity.ok(accountService.getBalance(id));
    }
    @PostMapping("/{id}/freeze")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN','ROLE_OPERATOR')")
    public ResponseEntity<Void> freezeAccount(@PathVariable Long id) {
        accountService.freezeAccount(id);
        return ResponseEntity.noContent().build();
    }
    @PostMapping("/{id}/unfreeze")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN','ROLE_OPERATOR')")
    public ResponseEntity<Void> unfreezeAccount(@PathVariable Long id) {
        accountService.unfreezeAccount(id);
        return ResponseEntity.noContent().build();
    }
    @PostMapping("/transfer")
    public ResponseEntity<TransferResult> transfer(@Valid @RequestBody TransferRequest request) {
        return ResponseEntity.ok(accountService.transfer(request));
    }
    @PostMapping("/deposit")
    public ResponseEntity<TransferResult> deposit(@Valid @RequestBody AmountRequest request) {
        return ResponseEntity.ok(accountService.deposit(request));
    }
    @PostMapping("/withdraw")
    public ResponseEntity<TransferResult> withdraw(@Valid @RequestBody AmountRequest request) {
        return ResponseEntity.ok(accountService.withdraw(request));
    }
}
