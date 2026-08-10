package com.finflow.audit.controller;

import com.finflow.audit.entity.AuditLog;
import com.finflow.audit.service.AuditQueryService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/audit")
@PreAuthorize("hasAnyAuthority('ROLE_ADMIN','ROLE_OPERATOR','ROLE_AUDITOR')")
public class AuditController {
    private final AuditQueryService auditQueryService;

    public AuditController(AuditQueryService auditQueryService) {
        this.auditQueryService = auditQueryService;
    }

    @GetMapping("/logs")
    public ResponseEntity<Page<AuditLog>> getLogs(
            @RequestParam(required = false) String eventType,
            Pageable pageable) {
        return ResponseEntity.ok(auditQueryService.getLogs(eventType, pageable));
    }

    @GetMapping("/logs/transaction/{transactionId}")
    public ResponseEntity<List<AuditLog>> getLogsForTransaction(@PathVariable String transactionId) {
        return ResponseEntity.ok(auditQueryService.getLogsForTransaction(transactionId));
    }
}
