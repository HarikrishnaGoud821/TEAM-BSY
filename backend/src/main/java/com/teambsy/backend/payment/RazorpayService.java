package com.teambsy.backend.payment;

import com.razorpay.Order;
import com.razorpay.RazorpayClient;
import com.razorpay.Utils;
import org.json.JSONObject;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;

@Service
public class RazorpayService {

    private final RazorpayClient razorpayClient;
    private final String keyId;
    private final String keySecret;

    public RazorpayService() throws Exception {

        this.keyId = System.getenv("RAZORPAY_KEY_ID");
        this.keySecret = System.getenv("RAZORPAY_KEY_SECRET");

        if (keyId == null || keyId.isBlank()) {
            throw new IllegalStateException(
                    "RAZORPAY_KEY_ID environment variable is not set"
            );
        }

        if (keySecret == null || keySecret.isBlank()) {
            throw new IllegalStateException(
                    "RAZORPAY_KEY_SECRET environment variable is not set"
            );
        }

        this.razorpayClient =
                new RazorpayClient(
                        keyId,
                        keySecret
                );
    }

    public Order createOrder(
            BigDecimal amount,
            String receipt) throws Exception {

        if (amount == null || amount.signum() <= 0) {
            throw new IllegalArgumentException(
                    "Amount must be greater than zero"
            );
        }

        long amountInPaise =
                amount
                        .multiply(BigDecimal.valueOf(100))
                        .longValueExact();

        JSONObject orderRequest =
                new JSONObject();

        orderRequest.put(
                "amount",
                amountInPaise
        );

        orderRequest.put(
                "currency",
                "INR"
        );

        orderRequest.put(
                "receipt",
                receipt
        );

        orderRequest.put(
                "payment_capture",
                1
        );

        return razorpayClient.orders.create(
                orderRequest
        );
    }

    public Order fetchOrder(
            String orderId) throws Exception {

        if (orderId == null || orderId.isBlank()) {
            throw new IllegalArgumentException(
                    "Razorpay order ID is required"
            );
        }

        return razorpayClient.orders.fetch(
                orderId
        );
    }

    public boolean verifyPaymentSignature(
            String orderId,
            String paymentId,
            String signature) {

        try {

            if (orderId == null
                    || orderId.isBlank()
                    || paymentId == null
                    || paymentId.isBlank()
                    || signature == null
                    || signature.isBlank()) {

                return false;
            }

            String payload =
                    orderId + "|" + paymentId;

            return Utils.verifySignature(
                    payload,
                    signature,
                    keySecret
            );

        } catch (Exception e) {

            return false;
        }
    }

    public BigDecimal paiseToRupees(
            long amountInPaise) {

        return BigDecimal
                .valueOf(amountInPaise)
                .divide(
                        BigDecimal.valueOf(100)
                );
    }

    public String getKeyId() {
        return keyId;
    }
}