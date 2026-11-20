package com.teambsy.backend.repository;

import com.teambsy.backend.entity.AuditLog;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface AuditLogRepository extends JpaRepository<AuditLog, String> {
    List<AuditLog> findAllByOrderByCreatedAtDesc(Pageable pageable);
}
