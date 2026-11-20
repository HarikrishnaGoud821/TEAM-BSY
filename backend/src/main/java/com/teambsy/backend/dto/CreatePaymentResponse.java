package com.teambsy.backend.dto;

public record CreatePaymentResponse(
        String orderId,
        long amount,
        String keyId,
        String contributionId
) {
}