package com.teambsy.backend.contribution;

import com.teambsy.backend.model.Contribution;
import com.teambsy.backend.model.PaymentMethod;
import com.teambsy.backend.model.PaymentStatus;
import com.teambsy.backend.model.VerificationStatus;
import com.teambsy.backend.repository.ContributionRepository;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class ContributionService {

    private final ContributionRepository contributionRepository;

    public ContributionService(
            ContributionRepository contributionRepository) {

        this.contributionRepository =
                contributionRepository;
    }

    /*
     * ============================================================
     * CREATE CONTRIBUTION
     * ============================================================
     *
     * CASH:
     * PENDING + Admin verification required
     *
     * ONLINE:
     * PENDING initially
     */
    public ContributionResponse createContribution(
            ContributionRequest request) {

        validateRequest(request);

        Contribution contribution =
                new Contribution();

        contribution.setContributorId(
                request.getContributorId()
        );

        contribution.setMentorId(
                request.getMentorId()
        );

        contribution.setContributorName(
                request.getContributorName().trim()
        );

        contribution.setMobileNumber(
                request.getMobileNumber()
        );

        contribution.setAmount(
                request.getAmount()
        );

        contribution.setPaymentMethod(
                request.getPaymentMethod()
        );

        contribution.setTransactionId(
                request.getTransactionId()
        );

        contribution.setPhotoUrl(
                request.getPhotoUrl()
        );

        contribution.setNotes(
                request.getNotes()
        );

        /*
         * CASH CONTRIBUTION
         *
         * Admin/Mentor must verify it.
         */
        if (request.getPaymentMethod()
                == PaymentMethod.CASH) {

            contribution.setPaymentStatus(
                    PaymentStatus.PENDING
            );

            contribution.setVerificationStatus(
                    VerificationStatus.PENDING
            );

        } else {

            /*
             * ONLINE CONTRIBUTION
             *
             * Payment verification is handled
             * separately.
             */
            contribution.setPaymentStatus(
                    PaymentStatus.PENDING
            );

            contribution.setVerificationStatus(
                    VerificationStatus.NOT_REQUIRED
            );
        }

        Contribution saved =
                contributionRepository.save(
                        contribution
                );

        return ContributionResponse.from(saved);
    }

    /*
     * ============================================================
     * CREATE VERIFIED ONLINE CONTRIBUTION
     * ============================================================
     *
     * This method is called only after
     * Razorpay payment verification succeeds.
     */
    public ContributionResponse createVerifiedOnlineContribution(
            ContributionRequest request) {

        validateRequest(request);

        /*
         * Cash payments cannot use this method.
         */
        if (request.getPaymentMethod()
                == PaymentMethod.CASH) {

            throw new IllegalArgumentException(
                    "Cash payments cannot use online verification"
            );
        }

        /*
         * Prevent the same Razorpay payment
         * from being recorded twice.
         */
        if (request.getTransactionId() != null
                && !request.getTransactionId().isBlank()) {

            boolean exists =
                    contributionRepository
                            .existsByTransactionId(
                                    request.getTransactionId()
                            );

            if (exists) {

                throw new IllegalStateException(
                        "This payment has already been recorded"
                );
            }
        }

        Contribution contribution =
                new Contribution();

        contribution.setContributorId(
                request.getContributorId()
        );

        contribution.setMentorId(
                request.getMentorId()
        );

        contribution.setContributorName(
                request.getContributorName().trim()
        );

        contribution.setMobileNumber(
                request.getMobileNumber()
        );

        contribution.setAmount(
                request.getAmount()
        );

        contribution.setPaymentMethod(
                request.getPaymentMethod()
        );

        contribution.setTransactionId(
                request.getTransactionId()
        );

        contribution.setPhotoUrl(
                request.getPhotoUrl()
        );

        contribution.setNotes(
                request.getNotes()
        );

        /*
         * Razorpay payment has already been
         * successfully verified.
         */
        contribution.setPaymentStatus(
                PaymentStatus.SUCCESS
        );

        contribution.setVerificationStatus(
                VerificationStatus.NOT_REQUIRED
        );

        contribution.setVerifiedAt(
                LocalDateTime.now()
        );

        Contribution saved =
                contributionRepository.save(
                        contribution
                );

        return ContributionResponse.from(saved);
    }

    /*
     * ============================================================
     * GET ALL CONTRIBUTIONS
     * ============================================================
     */
    public List<ContributionResponse>
    getAllContributions() {

        return contributionRepository
                .findAllByOrderByCreatedAtDesc()
                .stream()
                .map(ContributionResponse::from)
                .toList();
    }

    /*
     * ============================================================
     * GET PENDING CONTRIBUTIONS
     * ============================================================
     */
    public List<ContributionResponse>
    getPendingContributions() {

        return contributionRepository
                .findByVerificationStatusOrderByCreatedAtDesc(
                        VerificationStatus.PENDING
                )
                .stream()
                .map(ContributionResponse::from)
                .toList();
    }

    /*
     * ============================================================
     * GET USER CONTRIBUTIONS
     * ============================================================
     */
    public List<ContributionResponse>
    getUserContributions(Long contributorId) {

        return contributionRepository
                .findByContributorIdOrderByCreatedAtDesc(
                        contributorId
                )
                .stream()
                .map(ContributionResponse::from)
                .toList();
    }

    /*
     * ============================================================
     * GET MENTOR CONTRIBUTIONS
     * ============================================================
     */
    public List<ContributionResponse>
    getMentorContributions(Long mentorId) {

        return contributionRepository
                .findByMentorIdOrderByCreatedAtDesc(
                        mentorId
                )
                .stream()
                .map(ContributionResponse::from)
                .toList();
    }

    /*
     * ============================================================
     * ADMIN VERIFY CONTRIBUTION
     * ============================================================
     *
     * Used for PENDING cash/offline contributions.
     */
    public ContributionResponse verifyContribution(
            Long contributionId,
            Long adminId) {

        Contribution contribution =
                contributionRepository
                        .findById(contributionId)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Contribution not found"
                                )
                        );

        /*
         * Only PENDING contributions can use
         * the normal Verify button.
         */
        if (contribution.getVerificationStatus()
                != VerificationStatus.PENDING) {

            throw new IllegalStateException(
                    "This contribution is not pending verification"
            );
        }

        /*
         * Verify operation is only for CASH.
         */
        if (contribution.getPaymentMethod()
                != PaymentMethod.CASH) {

            throw new IllegalStateException(
                    "Only offline CASH contributions can be verified manually"
            );
        }

        contribution.setPaymentStatus(
                PaymentStatus.SUCCESS
        );

        contribution.setVerificationStatus(
                VerificationStatus.VERIFIED
        );

        contribution.setVerifiedAt(
                LocalDateTime.now()
        );

        contribution.setVerifiedBy(
                adminId
        );

        Contribution saved =
                contributionRepository.save(
                        contribution
                );

        return ContributionResponse.from(saved);
    }

    /*
     * ============================================================
     * ADMIN REJECT CONTRIBUTION
     * ============================================================
     *
     * Used for PENDING cash/offline contributions.
     */
    public ContributionResponse rejectContribution(
            Long contributionId,
            Long adminId) {

        Contribution contribution =
                contributionRepository
                        .findById(contributionId)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Contribution not found"
                                )
                        );

        /*
         * Only PENDING contributions can use
         * the normal Reject button.
         */
        if (contribution.getVerificationStatus()
                != VerificationStatus.PENDING) {

            throw new IllegalStateException(
                    "This contribution is not pending verification"
            );
        }

        /*
         * Reject operation is only for CASH.
         */
        if (contribution.getPaymentMethod()
                != PaymentMethod.CASH) {

            throw new IllegalStateException(
                    "Only offline CASH contributions can be rejected manually"
            );
        }

        contribution.setPaymentStatus(
                PaymentStatus.REJECTED
        );

        contribution.setVerificationStatus(
                VerificationStatus.REJECTED
        );

        contribution.setVerifiedAt(
                LocalDateTime.now()
        );

        contribution.setVerifiedBy(
                adminId
        );

        Contribution saved =
                contributionRepository.save(
                        contribution
                );

        return ContributionResponse.from(saved);
    }

    /*
     * ============================================================
     * ADMIN CHANGE CONTRIBUTION STATUS
     * ============================================================
     *
     * Allows Admin to change an existing CASH contribution
     * between VERIFIED and REJECTED.
     */
    public ContributionResponse changeContributionStatus(
            Long contributionId,
            Long adminId,
            String status) {

        Contribution contribution =
                contributionRepository
                        .findById(contributionId)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Contribution not found"
                                )
                        );

        /*
         * Status changes are only allowed for CASH.
         */
        if (contribution.getPaymentMethod()
                != PaymentMethod.CASH) {

            throw new IllegalStateException(
                    "Only offline CASH contributions can have their status changed manually"
            );
        }

        /*
         * Validate status.
         */
        if (status == null || status.isBlank()) {

            throw new IllegalArgumentException(
                    "Status is required"
            );
        }

        VerificationStatus newStatus;

        try {

            newStatus = VerificationStatus.valueOf(
                    status.toUpperCase()
            );

        } catch (IllegalArgumentException e) {

            throw new IllegalArgumentException(
                    "Invalid status. Use VERIFIED or REJECTED"
            );
        }

        /*
         * Only VERIFIED and REJECTED are allowed
         * from this specific operation.
         */
        if (newStatus != VerificationStatus.VERIFIED
                && newStatus != VerificationStatus.REJECTED) {

            throw new IllegalArgumentException(
                    "Only VERIFIED or REJECTED status can be selected"
            );
        }

        /*
         * Update verification status.
         */
        contribution.setVerificationStatus(
                newStatus
        );

        /*
         * Update payment status.
         */
        if (newStatus
                == VerificationStatus.VERIFIED) {

            contribution.setPaymentStatus(
                    PaymentStatus.SUCCESS
            );

        } else {

            contribution.setPaymentStatus(
                    PaymentStatus.REJECTED
            );
        }

        /*
         * Save admin information.
         */
        contribution.setVerifiedBy(
                adminId
        );

        contribution.setVerifiedAt(
                LocalDateTime.now()
        );

        Contribution saved =
                contributionRepository.save(
                        contribution
                );

        return ContributionResponse.from(saved);
    }

    /*
     * ============================================================
     * ADMIN EDIT OFFLINE / CASH CONTRIBUTION
     * ============================================================
     *
     * Only CASH contributions can be edited.
     *
     * Editable:
     * - Contributor name
     * - Mobile number
     * - Amount
     * - Transaction ID
     * - Notes
     * - Payment status
     *
     * Allowed statuses:
     * - PENDING
     * - SUCCESS
     * - FAILED
     */
    public ContributionResponse editOfflineContribution(
            Long contributionId,
            Long adminId,
            String contributorName,
            String mobileNumber,
            BigDecimal amount,
            String transactionId,
            String notes,
            String paymentStatus) {

        Contribution contribution =
                contributionRepository
                        .findById(contributionId)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Contribution not found"
                                )
                        );

        /*
         * ========================================================
         * ONLY CASH / OFFLINE PAYMENTS CAN BE EDITED
         * ========================================================
         */
        if (contribution.getPaymentMethod()
                != PaymentMethod.CASH) {

            throw new IllegalStateException(
                    "Only offline CASH contributions can be edited"
            );
        }

        /*
         * ========================================================
         * VALIDATE CONTRIBUTOR NAME
         * ========================================================
         */
        if (contributorName == null
                || contributorName.isBlank()) {

            throw new IllegalArgumentException(
                    "Contributor name is required"
            );
        }

        /*
         * ========================================================
         * VALIDATE AMOUNT
         * ========================================================
         */
        if (amount == null
                || amount.signum() <= 0) {

            throw new IllegalArgumentException(
                    "Amount must be greater than zero"
            );
        }

        /*
         * ========================================================
         * VALIDATE PAYMENT STATUS
         * ========================================================
         */
        if (paymentStatus == null
                || paymentStatus.isBlank()) {

            throw new IllegalArgumentException(
                    "Payment status is required"
            );
        }

        PaymentStatus newPaymentStatus;

        try {

            newPaymentStatus =
                    PaymentStatus.valueOf(
                            paymentStatus.toUpperCase()
                    );

        } catch (IllegalArgumentException e) {

            throw new IllegalArgumentException(
                    "Invalid payment status. Use PENDING, SUCCESS or FAILED"
            );
        }

        /*
         * ========================================================
         * UPDATE CONTRIBUTOR DETAILS
         * ========================================================
         */
        contribution.setContributorName(
                contributorName.trim()
        );

        contribution.setMobileNumber(
                mobileNumber
        );

        contribution.setAmount(
                amount
        );

        contribution.setTransactionId(
                transactionId
        );

        contribution.setNotes(
                notes
        );

        /*
         * ========================================================
         * UPDATE PAYMENT STATUS
         * ========================================================
         */
        contribution.setPaymentStatus(
                newPaymentStatus
        );

        /*
         * ========================================================
         * KEEP VERIFICATION STATUS IN SYNC
         * ========================================================
         */
        if (newPaymentStatus
                == PaymentStatus.PENDING) {

            contribution.setVerificationStatus(
                    VerificationStatus.PENDING
            );

            contribution.setVerifiedAt(
                    null
            );

            contribution.setVerifiedBy(
                    null
            );

        } else if (newPaymentStatus
                == PaymentStatus.SUCCESS) {

            contribution.setVerificationStatus(
                    VerificationStatus.VERIFIED
            );

            contribution.setVerifiedAt(
                    LocalDateTime.now()
            );

            contribution.setVerifiedBy(
                    adminId
            );

        } else if (newPaymentStatus
                == PaymentStatus.FAILED) {

            contribution.setVerificationStatus(
                    VerificationStatus.REJECTED
            );

            contribution.setVerifiedAt(
                    LocalDateTime.now()
            );

            contribution.setVerifiedBy(
                    adminId
            );

        } else if (newPaymentStatus
                == PaymentStatus.REJECTED) {

            /*
             * REJECTED is also kept synchronized
             * with the verification status.
             */
            contribution.setVerificationStatus(
                    VerificationStatus.REJECTED
            );

            contribution.setVerifiedAt(
                    LocalDateTime.now()
            );

            contribution.setVerifiedBy(
                    adminId
            );
        }

        /*
         * ========================================================
         * SAVE
         * ========================================================
         */
        Contribution saved =
                contributionRepository.save(
                        contribution
                );

        return ContributionResponse.from(saved);
    }

    /*
     * ============================================================
     * VALIDATION
     * ============================================================
     */
    private void validateRequest(
            ContributionRequest request) {

        if (request == null) {

            throw new IllegalArgumentException(
                    "Contribution request is required"
            );
        }

        if (request.getContributorName() == null
                || request.getContributorName()
                .isBlank()) {

            throw new IllegalArgumentException(
                    "Contributor name is required"
            );
        }

        if (request.getAmount() == null
                || request.getAmount().signum() <= 0) {

            throw new IllegalArgumentException(
                    "Amount must be greater than zero"
            );
        }

        if (request.getPaymentMethod() == null) {

            throw new IllegalArgumentException(
                    "Payment method is required"
            );
        }
    }
}