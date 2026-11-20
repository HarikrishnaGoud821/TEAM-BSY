package com.teambsy.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class VerifyPaymentRequest {

    @NotBlank
    @Size(min = 5, max = 64)
    private String razorpayOrderId;

    @NotBlank
    @Size(min = 5, max = 64)
    private String razorpayPaymentId;

    @NotBlank
    @Size(min = 10, max = 256)
    private String razorpaySignature;

    public String getRazorpayOrderId() {
        return razorpayOrderId;
    }

    public void setRazorpayOrderId(String razorpayOrderId) {
        this.razorpayOrderId = razorpayOrderId;
    }

    public String getRazorpayPaymentId() {
        return razorpayPaymentId;
    }

    public void setRazorpayPaymentId(String razorpayPaymentId) {
        this.razorpayPaymentId = razorpayPaymentId;
    }

    public String getRazorpaySignature() {
        return razorpaySignature;
    }

    public void setRazorpaySignature(String razorpaySignature) {
        this.razorpaySignature = razorpaySignature;
    }
}