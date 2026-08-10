package com.finflow.fraud.controller;

import com.finflow.fraud.entity.AlertStatus;
import com.finflow.fraud.entity.FraudAlert;
import com.finflow.fraud.service.FraudAlertService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/fraud")
@PreAuthorize("hasAnyAuthority('ROLE_ADMIN','ROLE_OPERATOR','ROLE_AUDITOR')")
public class FraudController {
    private final FraudAlertService fraudAlertService;
    public FraudController(FraudAlertService fraudAlertService) {
        this.fraudAlertService = fraudAlertService;
    }
    @GetMapping("/alerts")
    public ResponseEntity<Page<FraudAlert>> getAlerts(
            @RequestParam(required = false) AlertStatus status,
            Pageable pageable) {
        return ResponseEntity.ok(fraudAlertService.getAlerts(status, pageable));
    }
    @GetMapping("/alerts/{id}")
    public ResponseEntity<FraudAlert> getAlert(@PathVariable Long id) {
        return ResponseEntity.ok(fraudAlertService.getAlert(id));
    }
    @PostMapping("/alerts/{id}/resolve")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN','ROLE_OPERATOR')")
    public ResponseEntity<FraudAlert> resolveAlert(
            @PathVariable Long id,
            @RequestParam String resolvedBy,
            @RequestParam AlertStatus status) {
        return ResponseEntity.ok(fraudAlertService.resolveAlert(id, resolvedBy, status));
    }
    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getStats() {
        return ResponseEntity.ok(fraudAlertService.getDashboardStats());
    }
}
