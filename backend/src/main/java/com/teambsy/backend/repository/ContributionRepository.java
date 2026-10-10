package com.teambsy.backend.repository;

import com.teambsy.backend.model.Contribution;
import com.teambsy.backend.model.PaymentStatus;
import com.teambsy.backend.model.VerificationStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ContributionRepository
        extends JpaRepository<Contribution, Long> {

    List<Contribution> findByContributorIdOrderByCreatedAtDesc(
            Long contributorId
    );

    List<Contribution> findByMentorIdOrderByCreatedAtDesc(
            Long mentorId
    );

    List<Contribution> findByPaymentStatusOrderByCreatedAtDesc(
            PaymentStatus paymentStatus
    );

    List<Contribution> findByVerificationStatusOrderByCreatedAtDesc(
            VerificationStatus verificationStatus
    );

    List<Contribution> findAllByOrderByCreatedAtDesc();

    /*
     * Check whether a Razorpay payment has
     * already been recorded.
     */
    boolean existsByTransactionId(
            String transactionId
    );
}