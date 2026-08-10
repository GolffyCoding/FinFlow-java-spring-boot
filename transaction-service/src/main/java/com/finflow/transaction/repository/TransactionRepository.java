package com.finflow.transaction.repository;

import com.finflow.transaction.entity.Transaction;
import com.finflow.transaction.entity.TransactionStatus;
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
public interface TransactionRepository extends JpaRepository<Transaction, Long> {
    Optional<Transaction> findByTransactionId(String transactionId);
    Page<Transaction> findByFromAccountOrToAccount(String fromAccount, String toAccount, Pageable pageable);
    Page<Transaction> findByStatus(TransactionStatus status, Pageable pageable);

    @Query("SELECT t FROM Transaction t WHERE t.status = :status AND t.createdAt >= :since")
    List<Transaction> findRecentByStatus(@Param("status") TransactionStatus status, @Param("since") LocalDateTime since);

    @Query("SELECT COUNT(t) FROM Transaction t WHERE t.createdAt >= :since")
    Long countSince(@Param("since") LocalDateTime since);

    @Query("SELECT SUM(t.amount) FROM Transaction t WHERE t.status = 'COMPLETED' AND t.createdAt >= :since")
    java.math.BigDecimal sumCompletedSince(@Param("since") LocalDateTime since);

    @Query("SELECT t FROM Transaction t WHERE t.status = 'COMPLETED' AND t.createdAt >= :since")
    List<Transaction> findCompletedSince(@Param("since") LocalDateTime since);
}
