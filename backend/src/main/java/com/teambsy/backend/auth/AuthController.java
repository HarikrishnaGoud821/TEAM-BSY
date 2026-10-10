package com.teambsy.backend.auth;

import com.teambsy.backend.model.User;
import com.teambsy.backend.repository.UserRepository;
import com.teambsy.backend.security.JwtService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;
    private final OtpService otpService;
    private final UserRepository userRepository;
    private final JwtService jwtService;

    public AuthController(
            AuthService authService,
            OtpService otpService,
            UserRepository userRepository,
            JwtService jwtService) {

        this.authService = authService;
        this.otpService = otpService;
        this.userRepository = userRepository;
        this.jwtService = jwtService;
    }

    @PostMapping("/register")
    public ResponseEntity<UserResponse> register(
            @RequestBody RegisterRequest request) {

        User user = authService.register(request);

        return ResponseEntity.ok(
                UserResponse.from(user)
        );
    }

    @PostMapping("/send-otp")
    public ResponseEntity<?> sendOtp(
            @RequestBody SendOtpRequest request) {

        if (request.getMobileNumber() == null ||
                request.getMobileNumber().isBlank()) {

            return ResponseEntity.badRequest()
                    .body("Mobile number is required");
        }

        otpService.sendOtp(request.getMobileNumber());

        return ResponseEntity.ok(
                "OTP sent successfully"
        );
    }

    @PostMapping("/verify-otp")
    public ResponseEntity<?> verifyOtp(
            @RequestBody VerifyOtpRequest request) {

        if (request.getMobileNumber() == null ||
                request.getOtp() == null) {

            return ResponseEntity.badRequest()
                    .body("Mobile number and OTP are required");
        }

        boolean valid = otpService.verifyOtp(
                request.getMobileNumber(),
                request.getOtp()
        );

        if (!valid) {
            return ResponseEntity.status(401)
                    .body("Invalid or expired OTP");
        }

        User user = userRepository
                .findByMobileNumber(request.getMobileNumber())
                .orElse(null);

        if (user == null) {
            return ResponseEntity.status(404)
                    .body("User not registered");
        }

        String token = jwtService.generateToken(user);

        Map<String, Object> response = new HashMap<>();

        response.put("token", token);
        response.put("user", UserResponse.from(user));

        return ResponseEntity.ok(response);
    }
}