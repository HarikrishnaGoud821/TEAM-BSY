package com.teambsy.backend.contribution;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/contributions")
public class ContributionController {

    private final ContributionService contributionService;

    public ContributionController(
            ContributionService contributionService) {

        this.contributionService = contributionService;
    }

    /*
     * ============================================================
     * CREATE CONTRIBUTION
     * ============================================================
     */
    @PostMapping
    public ResponseEntity<ContributionResponse> createContribution(
            @RequestBody ContributionRequest request) {

        ContributionResponse response =
                contributionService.createContribution(request);

        return ResponseEntity.ok(response);
    }

    /*
     * ============================================================
     * GET ALL CONTRIBUTIONS
     * ============================================================
     */
    @GetMapping
    public ResponseEntity<List<ContributionResponse>> getAllContributions() {

        return ResponseEntity.ok(
                contributionService.getAllContributions()
        );
    }

    /*
     * ============================================================
     * GET PENDING CONTRIBUTIONS
     * ============================================================
     */
    @GetMapping("/pending")
    public ResponseEntity<List<ContributionResponse>> getPendingContributions() {

        return ResponseEntity.ok(
                contributionService.getPendingContributions()
        );
    }

    /*
     * ============================================================
     * GET USER CONTRIBUTIONS
     * ============================================================
     */
    @GetMapping("/user/{contributorId}")
    public ResponseEntity<List<ContributionResponse>> getUserContributions(
            @PathVariable Long contributorId) {

        return ResponseEntity.ok(
                contributionService.getUserContributions(
                        contributorId
                )
        );
    }

    /*
     * ============================================================
     * GET MENTOR CONTRIBUTIONS
     * ============================================================
     */
    @GetMapping("/mentor/{mentorId}")
    public ResponseEntity<List<ContributionResponse>> getMentorContributions(
            @PathVariable Long mentorId) {

        return ResponseEntity.ok(
                contributionService.getMentorContributions(
                        mentorId
                )
        );
    }

    /*
     * ============================================================
     * VERIFY OFFLINE / CASH CONTRIBUTION
     * ============================================================
     */
    @PutMapping("/{contributionId}/verify")
    public ResponseEntity<ContributionResponse> verifyContribution(
            @PathVariable Long contributionId,
            @RequestParam Long adminId) {

        return ResponseEntity.ok(
                contributionService.verifyContribution(
                        contributionId,
                        adminId
                )
        );
    }

    /*
     * ============================================================
     * REJECT OFFLINE / CASH CONTRIBUTION
     * ============================================================
     */
    @PutMapping("/{contributionId}/reject")
    public ResponseEntity<ContributionResponse> rejectContribution(
            @PathVariable Long contributionId,
            @RequestParam Long adminId) {

        return ResponseEntity.ok(
                contributionService.rejectContribution(
                        contributionId,
                        adminId
                )
        );
    }

    /*
     * ============================================================
     * EDIT OFFLINE / CASH CONTRIBUTION
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
     */
    @PutMapping("/{contributionId}/edit")
    public ResponseEntity<ContributionResponse> editOfflineContribution(
            @PathVariable Long contributionId,
            @RequestParam Long adminId,
            @RequestBody EditContributionRequest request) {

        return ResponseEntity.ok(
                contributionService.editOfflineContribution(
                        contributionId,
                        adminId,
                        request.getContributorName(),
                        request.getMobileNumber(),
                        request.getAmount(),
                        request.getTransactionId(),
                        request.getNotes(),
                        request.getPaymentStatus()
                )
        );
    }

    /*
     * ============================================================
     * EDIT CONTRIBUTION REQUEST
     * ============================================================
     */
    public static class EditContributionRequest {

        private String contributorName;

        private String mobileNumber;

        private BigDecimal amount;

        private String transactionId;

        private String notes;

        private String paymentStatus;

        public String getContributorName() {
            return contributorName;
        }

        public void setContributorName(
                String contributorName) {

            this.contributorName = contributorName;
        }

        public String getMobileNumber() {
            return mobileNumber;
        }

        public void setMobileNumber(
                String mobileNumber) {

            this.mobileNumber = mobileNumber;
        }

        public BigDecimal getAmount() {
            return amount;
        }

        public void setAmount(
                BigDecimal amount) {

            this.amount = amount;
        }

        public String getTransactionId() {
            return transactionId;
        }

        public void setTransactionId(
                String transactionId) {

            this.transactionId = transactionId;
        }

        public String getNotes() {
            return notes;
        }

        public void setNotes(
                String notes) {

            this.notes = notes;
        }

        public String getPaymentStatus() {
            return paymentStatus;
        }

        public void setPaymentStatus(
                String paymentStatus) {

            this.paymentStatus = paymentStatus;
        }
    }
}