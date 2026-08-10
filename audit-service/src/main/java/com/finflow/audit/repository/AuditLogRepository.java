package com.finflow.audit.repository;

import com.finflow.audit.entity.AuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {
    List<AuditLog> findByTransactionIdOrderByCreatedAtAsc(String transactionId);
    Page<AuditLog> findByEventType(String eventType, Pageable pageable);
}
