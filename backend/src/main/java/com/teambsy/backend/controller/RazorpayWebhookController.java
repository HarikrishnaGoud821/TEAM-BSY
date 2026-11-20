package com.teambsy.backend.controller;

import com.teambsy.backend.service.PaymentService;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/public")
public class RazorpayWebhookController {

    private final PaymentService paymentService;

    public RazorpayWebhookController(PaymentService paymentService) {
        this.paymentService = paymentService;
    }

    @PostMapping(
            path = "/razorpay-webhook",
            consumes = MediaType.ALL_VALUE
    )
    public ResponseEntity<String> handleWebhook(
            @RequestBody String body,
            @RequestHeader(
                    name = "x-razorpay-signature",
                    required = false
            ) String signature
    ) {
        if (!paymentService.handleWebhook(body, signature)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body("Invalid signature");
        }
        return ResponseEntity.ok("ok");
    }
}
