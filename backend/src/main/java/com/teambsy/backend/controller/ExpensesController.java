package com.teambsy.backend.controller;

import com.teambsy.backend.dto.ExpenseCreateRequest;
import com.teambsy.backend.dto.ExpenseReviewRequest;
import com.teambsy.backend.dto.ExpenseResponse;
import com.teambsy.backend.entity.AppRole;
import com.teambsy.backend.entity.Profile;
import com.teambsy.backend.repository.AppUserRepository;
import com.teambsy.backend.repository.ExpenseRepository;
import com.teambsy.backend.repository.ProfileRepository;
import com.teambsy.backend.repository.UserRoleRepository;
import com.teambsy.backend.service.ExpenseFileStorageService;
import com.teambsy.backend.service.ExpenseService;
import com.teambsy.backend.service.AuditLogService;

import org.springframework.core.io.Resource;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.Set;

@RestController
@RequestMapping("/api/expenses")
public class ExpensesController {

    private final ExpenseService expenseService;
    private final ExpenseRepository expenseRepository;
    private final UserRoleRepository userRoleRepository;
    private final ProfileRepository profileRepository;
    private final AppUserRepository appUserRepository;
    private final ExpenseFileStorageService fileStorageService;
    private final AuditLogService auditLogService;

    public ExpensesController(
            ExpenseService expenseService,
            ExpenseRepository expenseRepository,
            UserRoleRepository userRoleRepository,
            ProfileRepository profileRepository,
            AppUserRepository appUserRepository,
            ExpenseFileStorageService fileStorageService,
            AuditLogService auditLogService
    ) {
        this.expenseService = expenseService;
        this.expenseRepository = expenseRepository;
        this.userRoleRepository = userRoleRepository;
        this.profileRepository = profileRepository;
        this.appUserRepository = appUserRepository;
        this.fileStorageService = fileStorageService;
        this.auditLogService = auditLogService;
    }

    private boolean hasRole(String userId, AppRole... allowedRoles) {
        Set<AppRole> allowed = Set.of(allowedRoles);

        return userRoleRepository.findByUserId(userId)
                .stream()
                .anyMatch(role -> allowed.contains(role.getRole()));
    }

    private boolean canViewAll(String userId) {
        return hasRole(userId, AppRole.ADMIN, AppRole.TREASURER);
    }

    private String getUserName(String userId) {
        Profile profile = profileRepository.findById(userId).orElse(null);

        if (profile != null && profile.getFullName() != null
                && !profile.getFullName().isBlank()) {
            return profile.getFullName();
        }

        return appUserRepository.findById(userId)
                .map(user -> user.getEmail())
                .orElse("Unknown");
    }

    @GetMapping
    public ResponseEntity<List<ExpenseResponse>> getExpenses(
            @RequestParam(required = false) Integer year,
            Authentication authentication
    ) {
        String userId = authentication.getName();

        List<ExpenseResponse> expenses =
                expenseService.getExpenses(userId, canViewAll(userId));
        if (year != null) {
            expenses = expenses.stream()
                    .filter(expense -> expense.expense_date != null &&
                            expense.expense_date.getYear() == year)
                    .toList();
        }
        return ResponseEntity.ok(expenses);
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> createExpense(
            @RequestPart("expense") ExpenseCreateRequest request,
            @RequestPart("receipt") MultipartFile receipt,
            Authentication authentication
    ) {
        String userId = authentication.getName();

        if (!hasRole(userId, AppRole.ADMIN, AppRole.MENTOR)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("message", "Only Admins and Mentors can create expenses."));
        }

        Profile profile = profileRepository.findById(userId).orElse(null);
        String mentorMobile = profile != null ? profile.getMobile() : null;

        try {
            ExpenseResponse response = expenseService.createExpense(
                    userId,
                    getUserName(userId),
                    mentorMobile,
                    request,
                    receipt
            );
            auditLogService.record(
                    userId,
                    "EXPENSE_CREATED",
                    "expenses",
                    response.id,
                    response.status
            );

            return ResponseEntity.status(HttpStatus.CREATED).body(response);

        } catch (IllegalArgumentException exception) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", exception.getMessage()));
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getExpenseById(
            @PathVariable String id,
            Authentication authentication
    ) {
        String userId = authentication.getName();

        ExpenseResponse response = expenseService.getExpense(
                id,
                userId,
                canViewAll(userId)
        );

        if (response == null) {
            return ResponseEntity.notFound().build();
        }
        auditLogService.record(
                userId,
                "EXPENSE_" + request.status,
                "expenses",
                id,
                request.rejection_reason
        );

        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}/receipt")
    public ResponseEntity<?> getReceipt(
            @PathVariable String id,
            Authentication authentication
    ) {
        String userId = authentication.getName();

        var expense = expenseRepository.findById(id).orElse(null);

        if (expense == null) {
            return ResponseEntity.notFound().build();
        }

        boolean owner = userId.equals(expense.getMentorId());

        if (!owner && !canViewAll(userId)) {
            return ResponseEntity.notFound().build();
        }

        if (expense.getReceiptFileKey() == null) {
            return ResponseEntity.notFound().build();
        }

        try {
            Resource resource = fileStorageService.load(
                    expense.getReceiptFileKey()
            );

            MediaType mediaType = MediaType.APPLICATION_OCTET_STREAM;

            if (expense.getReceiptContentType() != null) {
                try {
                    mediaType = MediaType.parseMediaType(
                            expense.getReceiptContentType()
                    );
                } catch (Exception ignored) {
                    // Keep the safe default content type.
                }
            }

            String filename = expense.getReceiptFileName() != null
                    ? expense.getReceiptFileName().replaceAll("[\\r\\n\"]", "_")
                    : "expense-receipt";

            return ResponseEntity.ok()
                    .contentType(mediaType)
                    .header(
                            HttpHeaders.CONTENT_DISPOSITION,
                            ContentDisposition.inline()
                                    .filename(filename)
                                    .build()
                                    .toString()
                    )
                    .header("X-Content-Type-Options", "nosniff")
                    .body(resource);

        } catch (IOException | IllegalArgumentException exception) {
            return ResponseEntity.notFound().build();
        }
    }

    @PatchMapping("/{id}/review")
    public ResponseEntity<?> reviewExpense(
            @PathVariable String id,
            @RequestBody ExpenseReviewRequest request,
            Authentication authentication
    ) {
        String userId = authentication.getName();

        if (!hasRole(userId, AppRole.ADMIN)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("message", "Only Admins can review expenses."));
        }

        if (request == null || request.status == null) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Review status is required."));
        }

        try {
            ExpenseResponse response = expenseService.reviewExpense(
                    id,
                    userId,
                    getUserName(userId),
                    request.status,
                    request.rejection_reason
            );

            if (response == null) {
                return ResponseEntity.notFound().build();
            }

            return ResponseEntity.ok(response);

        } catch (IllegalArgumentException exception) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", exception.getMessage()));
        }
    }
}