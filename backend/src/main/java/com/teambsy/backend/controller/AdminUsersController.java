package com.teambsy.backend.controller;

import com.teambsy.backend.dto.AdminUserActiveRequest;
import com.teambsy.backend.dto.AdminUserResponse;
import com.teambsy.backend.entity.AppRole;
import com.teambsy.backend.entity.AppUser;
import com.teambsy.backend.entity.Profile;
import com.teambsy.backend.entity.UserRole;
import com.teambsy.backend.repository.AppUserRepository;
import com.teambsy.backend.repository.ProfileRepository;
import com.teambsy.backend.repository.UserRoleRepository;
import com.teambsy.backend.service.AuditLogService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Locale;

@RestController
@RequestMapping("/api/admin/users")
public class AdminUsersController {

    private final AppUserRepository appUserRepository;
    private final ProfileRepository profileRepository;
    private final UserRoleRepository userRoleRepository;
    private final AuditLogService auditLogService;

    public AdminUsersController(
            AppUserRepository appUserRepository,
            ProfileRepository profileRepository,
            UserRoleRepository userRoleRepository,
            AuditLogService auditLogService
    ) {
        this.appUserRepository = appUserRepository;
        this.profileRepository = profileRepository;
        this.userRoleRepository = userRoleRepository;
        this.auditLogService = auditLogService;
    }

    @GetMapping
    @Transactional(readOnly = true)
    public ResponseEntity<List<AdminUserResponse>> getUsers(
            Authentication authentication
    ) {
        requireAdmin(authentication.getName());
        List<AdminUserResponse> users = appUserRepository.findAll()
                .stream()
                .sorted((left, right) -> right.getCreatedAt()
                        .compareTo(left.getCreatedAt()))
                .map(this::toResponse)
                .toList();
        return ResponseEntity.ok(users);
    }

    @PostMapping("/{userId}/roles/{role}")
    @Transactional
    public ResponseEntity<Void> addRole(
            @PathVariable String userId,
            @PathVariable String role,
            Authentication authentication
    ) {
        requireAdmin(authentication.getName());
        AppRole parsedRole = parseRole(role);
        appUserRepository.findById(userId).orElseThrow(() ->
                new IllegalArgumentException("User not found"));
        if (!userRoleRepository.existsByUserIdAndRole(userId, parsedRole)) {
            UserRole userRole = new UserRole();
            userRole.setUserId(userId);
            userRole.setRole(parsedRole);
            userRoleRepository.save(userRole);
            auditLogService.record(
                    authentication.getName(),
                    "ROLE_ADDED",
                    "user_roles",
                    userId,
                    parsedRole.name()
            );
        }
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{userId}/roles/{role}")
    @Transactional
    public ResponseEntity<Void> removeRole(
            @PathVariable String userId,
            @PathVariable String role,
            Authentication authentication
    ) {
        String actorId = authentication.getName();
        requireAdmin(actorId);
        AppRole parsedRole = parseRole(role);
        if (parsedRole == AppRole.ADMIN && actorId.equals(userId)) {
            throw new IllegalArgumentException(
                    "You cannot remove your own admin role"
            );
        }
        if (parsedRole == AppRole.ADMIN &&
                userRoleRepository.findByUserId(userId).stream()
                        .anyMatch(item -> item.getRole() == AppRole.ADMIN) &&
                userRoleRepository.countByRole(AppRole.ADMIN) <= 1) {
            throw new IllegalArgumentException(
                    "The last administrator role cannot be removed"
            );
        }
        userRoleRepository.deleteByUserIdAndRole(userId, parsedRole);
        auditLogService.record(
                actorId,
                "ROLE_REMOVED",
                "user_roles",
                userId,
                parsedRole.name()
        );
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{userId}/active")
    @Transactional
    public ResponseEntity<Void> setActive(
            @PathVariable String userId,
            @RequestBody AdminUserActiveRequest request,
            Authentication authentication
    ) {
        String actorId = authentication.getName();
        requireAdmin(actorId);
        if (request == null || request.active == null) {
            throw new IllegalArgumentException("Active status is required");
        }
        if (actorId.equals(userId) && !request.active) {
            throw new IllegalArgumentException(
                    "You cannot deactivate your own account"
            );
        }

        AppUser user = appUserRepository.findById(userId).orElseThrow(() ->
                new IllegalArgumentException("User not found"));
        if (!request.active &&
                userRoleRepository.findByUserId(userId).stream()
                        .anyMatch(item -> item.getRole() == AppRole.ADMIN) &&
                userRoleRepository.findByRole(AppRole.ADMIN).stream()
                        .filter(item -> appUserRepository.findById(item.getUserId())
                                .map(AppUser::isActive)
                                .orElse(false))
                        .count() <= 1) {
            throw new IllegalArgumentException(
                    "The last active administrator cannot be deactivated"
            );
        }

        user.setActive(request.active);
        appUserRepository.save(user);
        profileRepository.findById(userId).ifPresent(profile -> {
            profile.setActive(request.active);
            profileRepository.save(profile);
        });
        auditLogService.record(
                actorId,
                request.active ? "USER_ACTIVATED" : "USER_DEACTIVATED",
                "app_users",
                userId,
                null
        );
        return ResponseEntity.noContent().build();
    }

    private AdminUserResponse toResponse(AppUser user) {
        Profile profile = profileRepository.findById(user.getId()).orElse(null);
        return new AdminUserResponse(
                user,
                profile,
                userRoleRepository.findByUserId(user.getId())
        );
    }

    private void requireAdmin(String userId) {
        if (!userRoleRepository.existsByUserIdAndRole(userId, AppRole.ADMIN)) {
            throw new AccessDeniedException("Only administrators can manage users");
        }
    }

    private AppRole parseRole(String role) {
        try {
            return AppRole.valueOf(role.toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException exception) {
            throw new IllegalArgumentException("Unknown user role");
        }
    }
}
