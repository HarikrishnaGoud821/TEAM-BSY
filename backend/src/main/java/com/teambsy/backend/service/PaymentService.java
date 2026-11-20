package com.teambsy.backend.service;

import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import com.teambsy.backend.dto.CreatePaymentRequest;
import com.teambsy.backend.dto.CreatePaymentResponse;
import com.teambsy.backend.dto.PaymentFailedRequest;
import com.teambsy.backend.dto.PaymentConfigResponse;
import com.teambsy.backend.dto.VerifyPaymentRequest;
import com.teambsy.backend.dto.VerifyPaymentResponse;
import com.teambsy.backend.entity.Contribution;
import com.teambsy.backend.entity.Profile;
import com.teambsy.backend.repository.ContributionRepository;
import com.teambsy.backend.repository.ProfileRepository;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Base64;
import java.util.HexFormat;
import java.util.Map;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;

@Service
public class PaymentService {

    @Value("${razorpay.key-id:}")
    private String keyId;

    @Value("${razorpay.key-secret:}")
    private String keySecret;

    @Value("${razorpay.webhook-secret:}")
    private String webhookSecret;

    private final ContributionRepository contributionRepository;
    private final ProfileRepository profileRepository;
    private final ReceiptNumberService receiptNumberService;
    private final ObjectMapper objectMapper;
    private final AuditLogService auditLogService;

    public PaymentService(
            ContributionRepository contributionRepository,
            ProfileRepository profileRepository,
            ReceiptNumberService receiptNumberService,
            ObjectMapper objectMapper,
            AuditLogService auditLogService) {
        this.contributionRepository = contributionRepository;
        this.profileRepository = profileRepository;
        this.receiptNumberService = receiptNumberService;
        this.objectMapper = objectMapper;
        this.auditLogService = auditLogService;
    }

    public PaymentConfigResponse getPaymentConfig() {
        if (keyId == null || keyId.isBlank()
                || keySecret == null || keySecret.isBlank()) {
            throw new IllegalStateException("Razorpay is not configured");
        }
        return new PaymentConfigResponse(keyId);
    }

    @Transactional
    public CreatePaymentResponse createPaymentOrder(
            CreatePaymentRequest request, String userId) {

        validateConfiguration();

        Profile profile = profileRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User profile not found"));

        long amountPaise;
        try {
            amountPaise = request.getAmount()
                    .multiply(BigDecimal.valueOf(100))
                    .longValueExact();
        } catch (ArithmeticException ex) {
            throw new IllegalArgumentException("Invalid payment amount");
        }

        try {
            Map<String, Object> orderData = Map.of(
                    "amount", amountPaise,
                    "currency", "INR",
                    "receipt", "BSY-" + java.util.UUID.randomUUID(),
                    "notes", Map.of(
                            "user_id", userId,
                            "donor_name", request.getDonorName()
                    )
            );

            JsonNode order = razorpayRequest(
                    "POST", "https://api.razorpay.com/v1/orders", orderData);

            String orderId = order.path("id").asText();
            long returnedAmount = order.path("amount").asLong();
            String currency = order.path("currency").asText();

            if (orderId.isBlank()
                    || returnedAmount != amountPaise
                    || !"INR".equals(currency)) {
                throw new IllegalStateException("Invalid Razorpay order response");
            }

            Contribution contribution = new Contribution();
            contribution.setAmount(request.getAmount());
            contribution.setCurrency("INR");
            contribution.setDonationMode("ONLINE");
            contribution.setPaymentMethod(request.getMethod());
            contribution.setPaymentProvider("RAZORPAY");
            contribution.setPaymentStatus("PENDING");
            contribution.setOrderId(orderId);
            contribution.setDonorName(request.getDonorName().trim());
            contribution.setDonorMobile(request.getDonorMobile());
            contribution.setUserId(userId);
            contribution.setVillage(request.getVillage());
            contribution.setMandal(request.getMandal());
            contribution.setDistrict(request.getDistrict());
            contribution.setPincode(request.getPincode());
            contribution.setPurpose(request.getPurpose());
            contribution.setNotes(request.getNotes());

            Contribution saved = contributionRepository.saveAndFlush(contribution);

            return new CreatePaymentResponse(
                    orderId, amountPaise, keyId, saved.getId());

        } catch (Exception ex) {
            throw new IllegalStateException(
                    "Unable to create Razorpay order: " + ex.getMessage(), ex);
        }
    }

    @Transactional
    public VerifyPaymentResponse verifyPayment(
            VerifyPaymentRequest request, String userId) {

        validateConfiguration();

        Contribution contribution = contributionRepository
                .findByOrderId(request.getRazorpayOrderId())
                .orElseThrow(() -> new IllegalArgumentException("Payment order not found"));

        if (!userId.equals(contribution.getUserId())) {
            throw new IllegalArgumentException("You cannot verify this payment");
        }

        if ("SUCCESS".equals(contribution.getPaymentStatus())) {
            if (request.getRazorpayPaymentId().equals(contribution.getPaymentId())) {
                return new VerifyPaymentResponse(contribution.getId());
            }
            throw new IllegalArgumentException("Payment already completed");
        }

        if (!"PENDING".equals(contribution.getPaymentStatus())) {
            throw new IllegalArgumentException("Payment is not pending");
        }

        try {
    String signatureData = request.getRazorpayOrderId()
            + "|" + request.getRazorpayPaymentId();

    String expectedSignature = hmacSha256(signatureData, keySecret);

    if (!MessageDigest.isEqual(
            expectedSignature.getBytes(StandardCharsets.UTF_8),
            request.getRazorpaySignature().getBytes(StandardCharsets.UTF_8))) {
        throw new IllegalArgumentException("Invalid payment signature");
    }

    JsonNode payment = razorpayRequest(
                    "GET",
                    "https://api.razorpay.com/v1/payments/"
                            + request.getRazorpayPaymentId(),
                    null);

            if (!request.getRazorpayOrderId().equals(
                    payment.path("order_id").asText())
                    || !"captured".equals(payment.path("status").asText())
                    || payment.path("amount").asLong()
                            != contribution.getAmount()
                                    .multiply(BigDecimal.valueOf(100)).longValueExact()
                    || !"INR".equals(payment.path("currency").asText())) {
                throw new IllegalArgumentException(
                        "Razorpay payment details do not match");
            }

            if (contributionRepository.existsByPaymentId(
                    request.getRazorpayPaymentId())) {
                throw new IllegalArgumentException("Payment ID already used");
            }

            contribution.setPaymentStatus("SUCCESS");
            contribution.setPaymentId(request.getRazorpayPaymentId());
            contribution.setTransactionId(request.getRazorpayPaymentId());
            contribution.setReceiptNumber(
                    receiptNumberService.generateReceiptNumber());

            contributionRepository.saveAndFlush(contribution);
            auditLogService.record(
                    userId,
                    "PAYMENT_SUCCEEDED",
                    "contributions",
                    contribution.getId(),
                    contribution.getPaymentId()
            );

            return new VerifyPaymentResponse(contribution.getId());

        } catch (IllegalArgumentException ex) {
            throw ex;
        } catch (Exception ex) {
            throw new IllegalStateException(
                    "Unable to verify Razorpay payment: " + ex.getMessage(), ex);
        }
    }

    @Transactional
    public void markPaymentFailed(PaymentFailedRequest request, String userId) {
        Contribution contribution = contributionRepository
                .findByOrderId(request.getOrderId())
                .orElseThrow(() -> new IllegalArgumentException("Payment order not found"));

        if (!userId.equals(contribution.getUserId())) {
            throw new IllegalArgumentException("You cannot update this payment");
        }

        @Transactional
        public boolean handleWebhook(String body, String signature) {
            if (webhookSecret == null || webhookSecret.isBlank()) {
                throw new IllegalStateException(
                        "Razorpay webhook secret is not configured"
                );
            }
            if (!isValidWebhookSignature(body, signature)) {
                return false;
            }

            JsonNode payload;
            try {
                payload = objectMapper.readTree(body);
            } catch (Exception exception) {
                throw new IllegalArgumentException("Invalid webhook payload");
            }

            String event = payload.path("event").asText();
            JsonNode payment = payload.path("payload").path("payment").path("entity");
            String orderId = payment.path("order_id").asText();
            String paymentId = payment.path("id").asText();
            if (orderId.isBlank() || paymentId.isBlank()) {
                return true;
            }

            Contribution contribution = contributionRepository.findByOrderId(orderId)
                    .orElseThrow(() -> new IllegalArgumentException(
                            "Payment order not found"
                    ));
            if ("payment.captured".equals(event)) {
                if ("SUCCESS".equals(contribution.getPaymentStatus())) {
                    if (!paymentId.equals(contribution.getPaymentId())) {
                        throw new IllegalArgumentException(
                                "Payment order was already completed with another payment"
                        );
                    }
                    return true;
                }
                if (!"PENDING".equals(contribution.getPaymentStatus())) {
                    return true;
                }
                if (contributionRepository.existsByPaymentId(paymentId)) {
                    throw new IllegalArgumentException("Payment ID already used");
                }
                contribution.setPaymentStatus("SUCCESS");
                contribution.setPaymentId(paymentId);
                contribution.setTransactionId(paymentId);
                contribution.setReceiptNumber(
                        receiptNumberService.generateReceiptNumber()
                );
                contributionRepository.saveAndFlush(contribution);
                auditLogService.record(
                        null,
                        "PAYMENT_SUCCEEDED",
                        "contributions",
                        contribution.getId(),
                        paymentId
                );
            } else if ("payment.failed".equals(event) &&
                    "PENDING".equals(contribution.getPaymentStatus())) {
                contribution.setPaymentStatus("FAILED");
                contributionRepository.save(contribution);
                auditLogService.record(
                        null,
                        "PAYMENT_FAILED",
                        "contributions",
                        contribution.getId(),
                        paymentId
                );
            }
            return true;
        }

        private boolean isValidWebhookSignature(String body, String signature) {
            if (body == null || signature == null || signature.isBlank()) {
                return false;
            }
            try {
                byte[] expected = HexFormat.of().parseHex(
                        hmacSha256(body, webhookSecret)
                );
                byte[] supplied = HexFormat.of().parseHex(signature);
                return MessageDigest.isEqual(expected, supplied);
            } catch (IllegalArgumentException exception) {
                return false;
            } catch (Exception exception) {
                throw new IllegalStateException(
                        "Could not verify Razorpay webhook signature",
                        exception
                );
            }
        }

        if ("PENDING".equals(contribution.getPaymentStatus())) {
            contribution.setPaymentStatus("FAILED");
            contributionRepository.save(contribution);
        }
    }

    private void validateConfiguration() {
        if (keyId == null || keyId.isBlank()
                || keySecret == null || keySecret.isBlank()) {
            throw new IllegalStateException("Razorpay API keys are not configured");
        }
    }

    private String hmacSha256(String data, String secret) throws Exception {
        Mac mac = Mac.getInstance("HmacSHA256");
        mac.init(new SecretKeySpec(
                secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
        return HexFormat.of().formatHex(
                mac.doFinal(data.getBytes(StandardCharsets.UTF_8)));
    }

    private JsonNode razorpayRequest(
            String method, String url, Object body) throws Exception {

        String credentials = keyId + ":" + keySecret;
        String encodedCredentials = Base64.getEncoder().encodeToString(
                credentials.getBytes(StandardCharsets.UTF_8));

        HttpHeaders headers = new HttpHeaders();
        headers.setBasicAuth(encodedCredentials);
        headers.setContentType(MediaType.APPLICATION_JSON);

        String jsonBody = body == null ? null : objectMapper.writeValueAsString(body);

        HttpEntity<String> entity = new HttpEntity<>(jsonBody, headers);

        org.springframework.web.client.RestTemplate restTemplate =
                new org.springframework.web.client.RestTemplate();

        ResponseEntity<String> response = restTemplate.exchange(
                url, HttpMethod.valueOf(method), entity, String.class);

        return objectMapper.readTree(response.getBody());
    }
}
