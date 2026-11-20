package com.teambsy.backend.controller;

import com.teambsy.backend.dto.AuditLogResponse;
import com.teambsy.backend.entity.AppRole;
import com.teambsy.backend.repository.UserRoleRepository;
import com.teambsy.backend.service.AuditLogService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/admin/audit")
public class AdminAuditController {

    private final UserRoleRepository userRoleRepository;
    private final AuditLogService auditLogService;

    public AdminAuditController(
            UserRoleRepository userRoleRepository,
            AuditLogService auditLogService
    ) {
        this.userRoleRepository = userRoleRepository;
        this.auditLogService = auditLogService;
    }

    @GetMapping
    public ResponseEntity<List<AuditLogResponse>> getRecent(
            @RequestParam(defaultValue = "300") int size,
            Authentication authentication
    ) {
        if (!userRoleRepository.existsByUserIdAndRole(
                authentication.getName(),
                AppRole.ADMIN
        )) {
            throw new AccessDeniedException("Only administrators can view audit logs");
        }
        return ResponseEntity.ok(auditLogService.recent(size));
    }
}
