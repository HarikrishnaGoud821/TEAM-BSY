
package com.teambsy.backend.repository;

import com.teambsy.backend.entity.Contribution;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ContributionRepository extends JpaRepository<Contribution, String> {

    // Contributions belonging to a particular user
    List<Contribution> findByUserIdOrderByCreatedAtDesc(String userId);

    // All contributions for admin, mentor and treasurer
    List<Contribution> findAllByOrderByCreatedAtDesc();

    // Find a contribution using Razorpay order ID
    Optional<Contribution> findByOrderId(String orderId);

    // Find a contribution using Razorpay payment ID
    Optional<Contribution> findByPaymentId(String paymentId);

    // Find a contribution by receipt number
    Optional<Contribution> findByReceiptNumber(String receiptNumber);

    // Check whether an order already exists
    boolean existsByOrderId(String orderId);

    // Check whether a payment already exists
    boolean existsByPaymentId(String paymentId);
}

