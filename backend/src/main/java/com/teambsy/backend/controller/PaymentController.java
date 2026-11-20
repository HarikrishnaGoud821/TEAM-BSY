package com.teambsy.backend.controller;

import com.teambsy.backend.dto.CreatePaymentRequest;
import com.teambsy.backend.dto.CreatePaymentResponse;
import com.teambsy.backend.dto.PaymentFailedRequest;
import com.teambsy.backend.dto.PaymentConfigResponse;
import com.teambsy.backend.dto.VerifyPaymentRequest;
import com.teambsy.backend.dto.VerifyPaymentResponse;
import com.teambsy.backend.service.PaymentService;

import jakarta.validation.Valid;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/payments")
public class PaymentController {

    private final PaymentService paymentService;

    public PaymentController(PaymentService paymentService) {
        this.paymentService = paymentService;
    }

    @GetMapping("/config")
    public ResponseEntity<PaymentConfigResponse> getPaymentConfig() {
        return ResponseEntity.ok(paymentService.getPaymentConfig());
    }

    @PostMapping("/orders")
    public ResponseEntity<CreatePaymentResponse> createPaymentOrder(
            @Valid @RequestBody CreatePaymentRequest request,
            @AuthenticationPrincipal String userId) {

        return ResponseEntity.ok(
                paymentService.createPaymentOrder(request, userId));
    }

    @PostMapping("/verify")
    public ResponseEntity<VerifyPaymentResponse> verifyPayment(
            @Valid @RequestBody VerifyPaymentRequest request,
            @AuthenticationPrincipal String userId) {

        return ResponseEntity.ok(
                paymentService.verifyPayment(request, userId));
    }

    @PostMapping("/failed")
    public ResponseEntity<Void> markPaymentFailed(
            @Valid @RequestBody PaymentFailedRequest request,
            @AuthenticationPrincipal String userId) {

        paymentService.markPaymentFailed(request, userId);
        return ResponseEntity.ok().build();
    }

}
