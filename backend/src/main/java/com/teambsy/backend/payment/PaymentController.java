package com.teambsy.backend.payment;

import com.teambsy.backend.contribution.ContributionService;
import com.razorpay.Order;
import com.razorpay.RazorpayException;
import com.teambsy.backend.contribution.ContributionRequest;
import com.teambsy.backend.contribution.ContributionResponse;
import com.teambsy.backend.model.PaymentMethod;
import org.json.JSONObject;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/payments")
public class PaymentController {

    private final RazorpayService razorpayService;
    private final ContributionService contributionService;

    public PaymentController(
            RazorpayService razorpayService,
            ContributionService contributionService) {

        this.razorpayService =
                razorpayService;

        this.contributionService =
                contributionService;
    }

    /*
     * CREATE RAZORPAY ORDER
     */
    @PostMapping("/create-order")
    public ResponseEntity<?> createOrder(
            @RequestBody CreateOrderRequest request) {

        try {

            if (request.getAmount() == null
                    || request.getAmount().signum() <= 0) {

                return ResponseEntity
                        .badRequest()
                        .body(
                                Map.of(
                                        "message",
                                        "Amount must be greater than zero"
                                )
                        );
            }

            String receipt =
                    "TEAMBSY-" +
                    UUID.randomUUID()
                            .toString()
                            .substring(0, 8);

            Order order =
                    razorpayService.createOrder(
                            request.getAmount(),
                            receipt
                    );

            JSONObject orderJson =
                    order.toJson();

            return ResponseEntity.ok(
                    Map.of(
                            "keyId",
                            razorpayService.getKeyId(),

                            "orderId",
                            orderJson.getString("id"),

                            "amount",
                            orderJson.getLong("amount"),

                            "currency",
                            orderJson.getString("currency"),

                            "receipt",
                            orderJson.getString("receipt")
                    )
            );

        } catch (RazorpayException e) {

            e.printStackTrace();

            return ResponseEntity
                    .status(
                            e.getStatusCode() > 0
                                    ? e.getStatusCode()
                                    : 500
                    )
                    .body(
                            Map.of(
                                    "message",
                                    "Razorpay order creation failed",

                                    "code",
                                    String.valueOf(
                                            e.getCode()
                                    ),

                                    "description",
                                    String.valueOf(
                                            e.getDescription()
                                    ),

                                    "reason",
                                    String.valueOf(
                                            e.getReason()
                                    )
                            )
                    );

        } catch (Exception e) {

            e.printStackTrace();

            return ResponseEntity
                    .internalServerError()
                    .body(
                            Map.of(
                                    "message",
                                    "Unable to create Razorpay order",

                                    "error",
                                    String.valueOf(
                                            e.getMessage()
                                    )
                            )
                    );
        }
    }

    /*
     * VERIFY RAZORPAY PAYMENT
     */
    @PostMapping("/verify")
    public ResponseEntity<?> verifyPayment(
            @RequestBody PaymentVerificationRequest request) {

        /*
         * Step 1:
         * Check Razorpay payment details.
         */
        if (request.getRazorpayOrderId() == null
                || request.getRazorpayOrderId().isBlank()
                || request.getRazorpayPaymentId() == null
                || request.getRazorpayPaymentId().isBlank()
                || request.getRazorpaySignature() == null
                || request.getRazorpaySignature().isBlank()) {

            return ResponseEntity
                    .badRequest()
                    .body(
                            Map.of(
                                    "message",
                                    "Razorpay payment details are required"
                            )
                    );
        }

        /*
         * Step 2:
         * Verify Razorpay signature.
         */
        boolean valid =
                razorpayService.verifyPaymentSignature(
                        request.getRazorpayOrderId(),
                        request.getRazorpayPaymentId(),
                        request.getRazorpaySignature()
                );

        if (!valid) {

            return ResponseEntity
                    .badRequest()
                    .body(
                            Map.of(
                                    "message",
                                    "Invalid Razorpay payment signature"
                            )
                    );
        }

        try {

            /*
             * Step 3:
             * Fetch the actual Razorpay order.
             *
             * IMPORTANT:
             * We do NOT trust the amount sent
             * by the frontend.
             */
            Order razorpayOrder =
                    razorpayService.fetchOrder(
                            request.getRazorpayOrderId()
                    );

            JSONObject orderJson =
                    razorpayOrder.toJson();

            /*
             * Step 4:
             * Get the trusted amount from Razorpay.
             */
            long amountInPaise =
                    orderJson.getLong("amount");

            if (amountInPaise <= 0) {

                return ResponseEntity
                        .badRequest()
                        .body(
                                Map.of(
                                        "message",
                                        "Invalid Razorpay order amount"
                                )
                        );
            }

            BigDecimal actualAmount =
                    razorpayService.paiseToRupees(
                            amountInPaise
                    );

            /*
             * Step 5:
             * Create TEAM BSY contribution.
             */
            ContributionRequest contributionRequest =
                    new ContributionRequest();

            contributionRequest.setContributorId(
                    request.getContributorId()
            );

            contributionRequest.setContributorName(
                    request.getContributorName()
            );

            contributionRequest.setMobileNumber(
                    request.getMobileNumber()
            );

            /*
             * Razorpay online payment.
             */
            contributionRequest.setPaymentMethod(
                    PaymentMethod.UPI
            );

            /*
             * Razorpay payment ID becomes
             * the contribution transaction ID.
             */
            contributionRequest.setTransactionId(
                    request.getRazorpayPaymentId()
            );

            contributionRequest.setPhotoUrl(
        request.getPhotoUrl()
);

            /*
             * Direct payment does not have
             * a mentor.
             */
            contributionRequest.setMentorId(
                    null
            );

            /*
             * IMPORTANT:
             * Use the amount obtained from
             * Razorpay, NOT request.getAmount().
             */
            contributionRequest.setAmount(
                    actualAmount
            );

            ContributionResponse contribution =
        contributionService.createVerifiedOnlineContribution(
                contributionRequest
        );

            /*
             * Step 6:
             * Online Razorpay payment is successful.
             *
             * createContribution() currently creates
             * online payments as PENDING.
             *
             * Therefore update the returned contribution
             * through the service in the next step.
             */

            return ResponseEntity.ok(
                    Map.of(
                            "message",
                            "Payment verified and contribution recorded",

                            "orderId",
                            request.getRazorpayOrderId(),

                            "paymentId",
                            request.getRazorpayPaymentId(),

                            "amount",
                            actualAmount,

                            "status",
                            "SUCCESS",

                            "contribution",
                            contribution
                    )
            );

        } catch (RazorpayException e) {

            e.printStackTrace();

            return ResponseEntity
                    .status(
                            e.getStatusCode() > 0
                                    ? e.getStatusCode()
                                    : 500
                    )
                    .body(
                            Map.of(
                                    "message",
                                    "Unable to fetch Razorpay order",

                                    "error",
                                    String.valueOf(
                                            e.getDescription()
                                    )
                            )
                    );

        } catch (Exception e) {

            e.printStackTrace();

            return ResponseEntity
                    .internalServerError()
                    .body(
                            Map.of(
                                    "message",
                                    "Payment verified but contribution could not be recorded",

                                    "error",
                                    String.valueOf(
                                            e.getMessage()
                                    )
                            )
                    );
        }
    }
}