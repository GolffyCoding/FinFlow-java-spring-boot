package com.finflow.fraud.service;

import com.finflow.fraud.entity.AlertStatus;
import com.finflow.fraud.entity.FraudAlert;
import com.finflow.fraud.repository.FraudAlertRepository;
import com.finflow.shared.exception.NotFoundException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class FraudAlertService {
    private final FraudAlertRepository fraudAlertRepository;

    public FraudAlertService(FraudAlertRepository fraudAlertRepository) {
        this.fraudAlertRepository = fraudAlertRepository;
    }

    @Transactional(readOnly = true)
    public Page<FraudAlert> getAlerts(AlertStatus status, Pageable pageable) {
        if (status != null) {
            return fraudAlertRepository.findByStatus(status, pageable);
        }
        return fraudAlertRepository.findAll(pageable);
    }

    @Transactional(readOnly = true)
    public FraudAlert getAlert(Long id) {
        return fraudAlertRepository.findById(id)
            .orElseThrow(() -> new NotFoundException("Alert not found"));
    }

    @Transactional
    public FraudAlert resolveAlert(Long id, String resolvedBy, AlertStatus newStatus) {
        FraudAlert alert = fraudAlertRepository.findById(id)
            .orElseThrow(() -> new NotFoundException("Alert not found"));
        alert.setStatus(newStatus);
        alert.setResolvedBy(resolvedBy);
        alert.setResolvedAt(LocalDateTime.now());
        return fraudAlertRepository.save(alert);
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getDashboardStats() {
        LocalDateTime today = LocalDateTime.now().toLocalDate().atStartOfDay();
        Map<String, Object> stats = new HashMap<>();

        Long openCount = fraudAlertRepository.countByStatus(AlertStatus.OPEN);
        Long confirmedCount = fraudAlertRepository.countByStatus(AlertStatus.CONFIRMED_FRAUD);
        List<Object[]> levelCounts = fraudAlertRepository.countByLevel();
        List<Map<String, Object>> levelBreakdown = levelCounts.stream()
            .map(row -> {
                Map<String, Object> entry = new LinkedHashMap<>();
                entry.put("level", row[0]);
                entry.put("count", row[1]);
                return entry;
            })
            .collect(Collectors.toList());

        stats.put("openAlerts", openCount);
        stats.put("confirmedFraud", confirmedCount);
        stats.put("levelBreakdown", levelBreakdown);
        stats.put("totalToday", fraudAlertRepository.countSince(today));
        return stats;
    }
}
