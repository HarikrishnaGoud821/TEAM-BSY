package com.teambsy.backend.service;

import com.teambsy.backend.dto.AuditLogResponse;
import com.teambsy.backend.entity.AuditLog;
import com.teambsy.backend.repository.AuditLogRepository;
import com.teambsy.backend.repository.ProfileRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
public class AuditLogService {

    private final AuditLogRepository auditLogRepository;
    private final ProfileRepository profileRepository;

    public AuditLogService(
            AuditLogRepository auditLogRepository,
            ProfileRepository profileRepository
    ) {
        this.auditLogRepository = auditLogRepository;
        this.profileRepository = profileRepository;
    }

    @Transactional
    public void record(
            String userId,
            String action,
            String entity,
            String entityId,
            String details
    ) {
        AuditLog log = new AuditLog();
        log.setUserId(userId);
        log.setAction(action);
        log.setEntity(entity);
        log.setEntityId(entityId);
        log.setDetails(details);
        auditLogRepository.save(log);
    }

    @Transactional(readOnly = true)
    public List<AuditLogResponse> recent(int size) {
        if (size < 1 || size > 500) {
            throw new IllegalArgumentException(
                    "Audit log page size must be between 1 and 500"
            );
        }
        return auditLogRepository.findAllByOrderByCreatedAtDesc(
                        PageRequest.of(0, size)
                ).stream()
                .map(log -> new AuditLogResponse(
                        log,
                        log.getUserId() == null
                                ? "System / Razorpay"
                                : profileRepository.findById(log.getUserId())
                                        .map(profile -> profile.getFullName())
                                        .orElse("User")
                ))
                .toList();
    }
}
