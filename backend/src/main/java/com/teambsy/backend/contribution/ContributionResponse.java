package com.teambsy.backend.contribution;

import com.teambsy.backend.model.Contribution;
import com.teambsy.backend.model.PaymentMethod;
import com.teambsy.backend.model.PaymentStatus;
import com.teambsy.backend.model.VerificationStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class ContributionResponse {

    private Long id;
    private Long contributorId;
    private Long mentorId;
    private String contributorName;
    private String mobileNumber;
    private BigDecimal amount;
    private PaymentMethod paymentMethod;
    private PaymentStatus paymentStatus;
    private VerificationStatus verificationStatus;
    private String transactionId;
    private String photoUrl;
    private String notes;
    private LocalDateTime createdAt;
    private LocalDateTime verifiedAt;
    private Long verifiedBy;

    public ContributionResponse() {
    }

    public static ContributionResponse from(Contribution contribution) {
        ContributionResponse response = new ContributionResponse();

        response.id = contribution.getId();
        response.contributorId = contribution.getContributorId();
        response.mentorId = contribution.getMentorId();
        response.contributorName = contribution.getContributorName();
        response.mobileNumber = contribution.getMobileNumber();
        response.amount = contribution.getAmount();
        response.paymentMethod = contribution.getPaymentMethod();
        response.paymentStatus = contribution.getPaymentStatus();
        response.verificationStatus = contribution.getVerificationStatus();
        response.transactionId = contribution.getTransactionId();
        response.photoUrl = contribution.getPhotoUrl();
        response.notes = contribution.getNotes();
        response.createdAt = contribution.getCreatedAt();
        response.verifiedAt = contribution.getVerifiedAt();
        response.verifiedBy = contribution.getVerifiedBy();

        return response;
    }

    public Long getId() {
        return id;
    }

    public Long getContributorId() {
        return contributorId;
    }

    public Long getMentorId() {
        return mentorId;
    }

    public String getContributorName() {
        return contributorName;
    }

    public String getMobileNumber() {
        return mobileNumber;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public PaymentMethod getPaymentMethod() {
        return paymentMethod;
    }

    public PaymentStatus getPaymentStatus() {
        return paymentStatus;
    }

    public VerificationStatus getVerificationStatus() {
        return verificationStatus;
    }

    public String getTransactionId() {
        return transactionId;
    }

    public String getPhotoUrl() {
        return photoUrl;
    }

    public String getNotes() {
        return notes;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getVerifiedAt() {
        return verifiedAt;
    }

    public Long getVerifiedBy() {
        return verifiedBy;
    }
}