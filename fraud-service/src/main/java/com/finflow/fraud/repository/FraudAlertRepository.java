package com.finflow.fraud.repository;

import com.finflow.fraud.entity.FraudAlert;
import com.finflow.fraud.entity.AlertStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface FraudAlertRepository extends JpaRepository<FraudAlert, Long> {
    Optional<FraudAlert> findByTransactionId(String transactionId);
    Page<FraudAlert> findByStatus(AlertStatus status, Pageable pageable);

    @Query("SELECT fa FROM FraudAlert fa WHERE fa.createdAt >= :since ORDER BY fa.fraudScore DESC")
    List<FraudAlert> findRecentAlerts(@Param("since") LocalDateTime since);

    @Query("SELECT COUNT(fa) FROM FraudAlert fa WHERE fa.status = :status AND fa.createdAt >= :since")
    Long countByStatusAndDate(@Param("status") AlertStatus status, @Param("since") LocalDateTime since);

    Long countByStatus(AlertStatus status);

    @Query("SELECT COUNT(fa) FROM FraudAlert fa WHERE fa.createdAt >= :since")
    Long countSince(@Param("since") LocalDateTime since);

    @Query("SELECT fa.fraudLevel, COUNT(fa) FROM FraudAlert fa GROUP BY fa.fraudLevel")
    List<Object[]> countByLevel();
}
