package com.teambsy.backend.controller;

import com.teambsy.backend.dto.CashContributionRequest;
import com.teambsy.backend.dto.ContributionResponse;
import com.teambsy.backend.dto.ReceiptResponse;
import com.teambsy.backend.entity.AppRole;
import com.teambsy.backend.entity.Contribution;
import com.teambsy.backend.entity.Profile;
import com.teambsy.backend.repository.AppUserRepository;
import com.teambsy.backend.repository.ContributionRepository;
import com.teambsy.backend.repository.ProfileRepository;
import com.teambsy.backend.repository.UserRoleRepository;
import com.teambsy.backend.service.ReceiptNumberService;
import com.teambsy.backend.service.AuditLogService;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Set;

@RestController
@RequestMapping("/api/contributions")
public class ContributionsController {

    private static final Set<AppRole> FINANCE_ROLES = Set.of(
            AppRole.ADMIN,
            AppRole.MENTOR,
            AppRole.TREASURER
    );

    private final ContributionRepository contributionRepository;
    private final UserRoleRepository userRoleRepository;
    private final ProfileRepository profileRepository;
    private final AppUserRepository appUserRepository;
    private final ReceiptNumberService receiptNumberService;
    private final AuditLogService auditLogService;

    public ContributionsController(
            ContributionRepository contributionRepository,
            UserRoleRepository userRoleRepository,
            ProfileRepository profileRepository,
            AppUserRepository appUserRepository,
            ReceiptNumberService receiptNumberService,
            AuditLogService auditLogService
    ) {
        this.contributionRepository = contributionRepository;
        this.userRoleRepository = userRoleRepository;
        this.profileRepository = profileRepository;
        this.appUserRepository = appUserRepository;
        this.receiptNumberService = receiptNumberService;
        this.auditLogService = auditLogService;
    }

    @GetMapping
    public ResponseEntity<List<ContributionResponse>> getContributions(
            @RequestParam(required = false) Integer year,
            Authentication authentication
    ) {
        String userId = authentication.getName();

        boolean canViewAll = userRoleRepository.findByUserId(userId)
                .stream()
                .anyMatch(role -> FINANCE_ROLES.contains(role.getRole()));

        List<Contribution> contributions = canViewAll
                ? contributionRepository.findAllByOrderByCreatedAtDesc()
                : contributionRepository.findByUserIdOrderByCreatedAtDesc(userId);

        if (year != null) {
            LocalDate start = LocalDate.of(year, 1, 1);
            LocalDate end = start.plusYears(1);

            contributions = contributions.stream()
                    .filter(c -> !c.getDonationDate().isBefore(start)
                            && c.getDonationDate().isBefore(end))
                    .toList();
        }

        List<ContributionResponse> response = contributions.stream()
                .map(this::toResponse)
                .toList();

        return ResponseEntity.ok(response);
    }

    @PostMapping("/cash")
    @Transactional
    public ResponseEntity<?> recordCashContribution(
            @RequestBody CashContributionRequest request,
            Authentication authentication
    ) {
        String userId = authentication.getName();

        boolean authorized = userRoleRepository.findByUserId(userId)
                .stream()
                .anyMatch(role ->
                        role.getRole() == AppRole.ADMIN ||
                        role.getRole() == AppRole.MENTOR
                );

        if (!authorized) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("message", "Only Admins and Mentors can record cash."));
        }

        if (request.amount == null ||
                request.amount.compareTo(BigDecimal.ZERO) <= 0) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Amount must be greater than zero."));
        }

        if (request.donorName == null || request.donorName.isBlank()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Donor name is required."));
        }

        if (request.donorMobile == null ||
                !request.donorMobile.trim().matches("\\d{10}")) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Enter a valid 10-digit donor mobile number."));
        }

        if (request.donorName.trim().length() > 150 ||
                request.amount.precision() > 12 ||
                request.amount.scale() > 2) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "One or more fields exceed the allowed limits."));
        }

        if (request.purpose != null && request.purpose.length() > 150 ||
                request.village != null && request.village.length() > 100 ||
                request.mandal != null && request.mandal.length() > 100 ||
                request.district != null && request.district.length() > 100 ||
                request.pincode != null && request.pincode.length() > 6 ||
                request.notes != null && request.notes.length() > 5000) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "One or more donor details are too long."));
        }

        LocalDate donationDate = request.donationDate != null
                ? request.donationDate
                : LocalDate.now();

        if (donationDate.isAfter(LocalDate.now())) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Donation date cannot be in the future."));
        }

        Profile profile = profileRepository.findById(userId).orElse(null);

        String enteredByName = profile != null
                ? profile.getFullName()
                : appUserRepository.findById(userId)
                        .map(user -> user.getEmail())
                        .orElse("Unknown");

        Contribution contribution = new Contribution();

        contribution.setAmount(request.amount);
        contribution.setCurrency("INR");
        contribution.setDonationMode("OFFLINE");
        contribution.setPaymentMethod("CASH");
        contribution.setPaymentProvider(null);
        contribution.setPaymentStatus("SUCCESS");

        contribution.setDonorName(request.donorName.trim());
        contribution.setDonorMobile(request.donorMobile.trim());

        contribution.setPurpose(clean(request.purpose));
        contribution.setNotes(clean(request.notes));
        contribution.setVillage(clean(request.village));
        contribution.setMandal(clean(request.mandal));
        contribution.setDistrict(clean(request.district));
        contribution.setPincode(clean(request.pincode));

        contribution.setDonationDate(donationDate);
        contribution.setEnteredBy(userId);
        contribution.setEnteredByName(enteredByName);
        contribution.setReceiptNumber(receiptNumberService.generateReceiptNumber());

        Contribution saved = contributionRepository.save(contribution);
        auditLogService.record(
                userId,
                "CASH_CONTRIBUTION_RECORDED",
                "contributions",
                saved.getId(),
                saved.getReceiptNumber()
        );

        return ResponseEntity.status(HttpStatus.CREATED).body(
                Map.of(
                        "id", saved.getId(),
                        "receipt_number", saved.getReceiptNumber()
                )
        );
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getContributionById(
            @PathVariable String id,
            Authentication authentication
    ) {
        String userId = authentication.getName();

        Contribution contribution = contributionRepository.findById(id).orElse(null);

        if (contribution == null) {
            return ResponseEntity.notFound().build();
        }

        boolean canViewAll = userRoleRepository.findByUserId(userId)
                .stream()
                .anyMatch(role -> FINANCE_ROLES.contains(role.getRole()));

        boolean isOwner = userId.equals(contribution.getUserId())
                || userId.equals(contribution.getEnteredBy());

        if (!canViewAll && !isOwner) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok(new ReceiptResponse(contribution));
    }
    private String clean(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private ContributionResponse toResponse(Contribution c) {
        return new ContributionResponse(
                c.getId(),
                c.getSerialNo(),
                c.getReceiptNumber(),
                c.getDonationDate(),
                c.getDonorName(),
                c.getDonorMobile(),
                c.getAmount(),
                c.getPaymentMethod(),
                c.getPaymentStatus(),
                c.getPurpose(),
                c.getVillage(),
                c.getMandal(),
                c.getDistrict(),
                c.getPincode(),
                c.getEnteredByName(),
                c.getPaymentId()
        );
    }
}
