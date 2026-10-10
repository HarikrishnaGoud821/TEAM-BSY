package com.teambsy.backend.controller;

import com.teambsy.backend.model.Role;
import com.teambsy.backend.model.User;
import com.teambsy.backend.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/setup")
public class AdminSetupController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public AdminSetupController(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @PostMapping("/admin")
    public ResponseEntity<?> createFirstAdmin(
            @RequestBody AdminSetupRequest request) {

        if (userRepository.countByRole(Role.ADMIN) > 0) {
            return ResponseEntity.badRequest()
                    .body("Admin already exists");
        }

        User admin = new User();
        admin.setFullName(request.getFullName());
        admin.setEmail(request.getEmail());
        admin.setMobileNumber(request.getMobileNumber());
        admin.setPassword(passwordEncoder.encode(request.getPassword()));
        admin.setRole(Role.ADMIN);

        User savedAdmin = userRepository.save(admin);

        return ResponseEntity.ok(
                "First ADMIN created successfully. ID: " + savedAdmin.getId()
        );
    }

    public static class AdminSetupRequest {

        private String fullName;
        private String email;
        private String mobileNumber;
        private String password;

        public String getFullName() {
            return fullName;
        }

        public void setFullName(String fullName) {
            this.fullName = fullName;
        }

        public String getEmail() {
            return email;
        }

        public void setEmail(String email) {
            this.email = email;
        }

        public String getMobileNumber() {
            return mobileNumber;
        }

        public void setMobileNumber(String mobileNumber) {
            this.mobileNumber = mobileNumber;
        }

        public String getPassword() {
            return password;
        }

        public void setPassword(String password) {
            this.password = password;
        }
    }
}