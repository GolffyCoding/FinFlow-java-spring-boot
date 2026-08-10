package com.finflow.audit.service;

import com.finflow.audit.entity.AuditLog;
import com.finflow.audit.repository.AuditLogRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class AuditQueryService {
    private final AuditLogRepository auditLogRepository;

    public AuditQueryService(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    @Transactional(readOnly = true)
    public Page<AuditLog> getLogs(String eventType, Pageable pageable) {
        if (eventType != null) {
            return auditLogRepository.findByEventType(eventType, pageable);
        }
        return auditLogRepository.findAll(pageable);
    }

    @Transactional(readOnly = true)
    public List<AuditLog> getLogsForTransaction(String transactionId) {
        return auditLogRepository.findByTransactionIdOrderByCreatedAtAsc(transactionId);
    }
}
