
package com.teambsy.backend.controller;

import com.teambsy.backend.dto.AuthResponse;
import com.teambsy.backend.dto.LoginRequest;
import com.teambsy.backend.dto.RegisterRequest;
import com.teambsy.backend.service.AuthService;

import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(
            @Valid @RequestBody RegisterRequest request
    ) {
        AuthResponse response = authService.register(request);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(response);
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(
            @Valid @RequestBody LoginRequest request
    ) {
        AuthResponse response = authService.login(request);

        return ResponseEntity.ok(response);
    }

    @GetMapping("/me")
    public ResponseEntity<AuthResponse> getCurrentUser(
            Authentication authentication
    ) {
        String userId = authentication.getName();

        AuthResponse response =
                authService.getCurrentUser(userId);

        return ResponseEntity.ok(response);
    }
}
