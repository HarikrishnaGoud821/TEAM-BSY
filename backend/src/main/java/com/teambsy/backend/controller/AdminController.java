package com.teambsy.backend.controller;

import com.teambsy.backend.auth.UserResponse;
import com.teambsy.backend.model.Role;
import com.teambsy.backend.model.User;
import com.teambsy.backend.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public AdminController(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder) {

        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    // =========================================================
    // GET ALL USERS
    // =========================================================

    @GetMapping("/users")
    public ResponseEntity<List<UserResponse>> getAllUsers() {

        List<UserResponse> users = userRepository.findAll()
                .stream()
                .map(UserResponse::from)
                .toList();

        return ResponseEntity.ok(users);
    }

    // =========================================================
    // GET USERS BY ROLE
    // =========================================================

    @GetMapping("/users/role/{role}")
    public ResponseEntity<?> getUsersByRole(
            @PathVariable Role role) {

        List<UserResponse> users = userRepository
                .findByRole(role)
                .stream()
                .map(UserResponse::from)
                .toList();

        return ResponseEntity.ok(users);
    }

    // =========================================================
    // GET SINGLE USER
    // =========================================================

    @GetMapping("/users/{id}")
    public ResponseEntity<UserResponse> getUser(
            @PathVariable Long id) {

        return userRepository.findById(id)
                .map(user ->
                        ResponseEntity.ok(UserResponse.from(user)))
                .orElse(
                        ResponseEntity.notFound().build()
                );
    }

    // =========================================================
    // CREATE USER
    // =========================================================

    @PostMapping("/users")
    public ResponseEntity<?> createUser(
            @RequestBody CreateUserRequest request) {

        if (request.getMobileNumber() == null ||
                request.getMobileNumber().isBlank()) {

            return ResponseEntity.badRequest()
                    .body("Mobile number is required");
        }

        if (request.getPassword() == null ||
                request.getPassword().isBlank()) {

            return ResponseEntity.badRequest()
                    .body("Password is required");
        }

        if (userRepository
                .findByMobileNumber(request.getMobileNumber())
                .isPresent()) {

            return ResponseEntity.badRequest()
                    .body("Mobile number already exists");
        }

        if (request.getEmail() != null &&
                !request.getEmail().isBlank() &&
                userRepository.findByEmail(request.getEmail()).isPresent()) {

            return ResponseEntity.badRequest()
                    .body("Email already exists");
        }

        User user = new User();

        user.setFullName(request.getFullName());
        user.setEmail(request.getEmail());
        user.setMobileNumber(request.getMobileNumber());

        user.setPassword(
                passwordEncoder.encode(
                        request.getPassword()
                )
        );

        if (request.getRole() == null) {
            user.setRole(Role.MEMBER);
        } else {
            user.setRole(request.getRole());
        }

        user.setEnabled(true);

        User savedUser = userRepository.save(user);

        return ResponseEntity.ok(
                UserResponse.from(savedUser)
        );
    }

    // =========================================================
    // EDIT USER DETAILS
    // =========================================================

    @PutMapping("/users/{id}")
    public ResponseEntity<?> updateUser(
            @PathVariable Long id,
            @RequestBody UpdateUserRequest request) {

        return userRepository.findById(id)
                .map(user -> {

                    if (request.getFullName() != null) {
                        user.setFullName(
                                request.getFullName()
                        );
                    }

                    if (request.getEmail() != null &&
                            !request.getEmail().equals(user.getEmail())) {

                        if (userRepository
                                .findByEmail(request.getEmail())
                                .filter(existing ->
                                        !existing.getId()
                                                .equals(id))
                                .isPresent()) {

                            return ResponseEntity.badRequest()
                                    .body("Email already exists");
                        }

                        user.setEmail(request.getEmail());
                    }

                    if (request.getMobileNumber() != null &&
                            !request.getMobileNumber()
                                    .equals(user.getMobileNumber())) {

                        if (userRepository
                                .findByMobileNumber(
                                        request.getMobileNumber())
                                .filter(existing ->
                                        !existing.getId()
                                                .equals(id))
                                .isPresent()) {

                            return ResponseEntity.badRequest()
                                    .body("Mobile number already exists");
                        }

                        user.setMobileNumber(
                                request.getMobileNumber()
                        );
                    }

                    User updatedUser =
                            userRepository.save(user);

                    return ResponseEntity.ok(
                            UserResponse.from(updatedUser)
                    );
                })
                .orElse(
                        ResponseEntity.notFound().build()
                );
    }

    // =========================================================
    // CHANGE ROLE
    // =========================================================

    @PutMapping("/users/{id}/role")
    public ResponseEntity<?> changeRole(
            @PathVariable Long id,
            @RequestParam Role role) {

        return userRepository.findById(id)
                .map(user -> {

                    user.setRole(role);

                    User updatedUser =
                            userRepository.save(user);

                    return ResponseEntity.ok(
                            UserResponse.from(updatedUser)
                    );
                })
                .orElse(
                        ResponseEntity.notFound().build()
                );
    }

    // =========================================================
    // CHANGE PASSWORD
    // =========================================================

    @PutMapping("/users/{id}/password")
    public ResponseEntity<?> changePassword(
            @PathVariable Long id,
            @RequestBody ChangePasswordRequest request) {

        if (request.getPassword() == null ||
                request.getPassword().isBlank()) {

            return ResponseEntity.badRequest()
                    .body("Password is required");
        }

        return userRepository.findById(id)
                .map(user -> {

                    user.setPassword(
                            passwordEncoder.encode(
                                    request.getPassword()
                            )
                    );

                    userRepository.save(user);

                    return ResponseEntity.ok(
                            "Password changed successfully"
                    );
                })
                .orElse(
                        ResponseEntity.notFound().build()
                );
    }

    // =========================================================
    // ENABLE / DISABLE USER
    // =========================================================

    @PutMapping("/users/{id}/status")
    public ResponseEntity<?> changeStatus(
            @PathVariable Long id,
            @RequestParam boolean enabled) {

        return userRepository.findById(id)
                .map(user -> {

                    user.setEnabled(enabled);

                    User updatedUser =
                            userRepository.save(user);

                    return ResponseEntity.ok(
                            UserResponse.from(updatedUser)
                    );
                })
                .orElse(
                        ResponseEntity.notFound().build()
                );
    }

    // =========================================================
    // DELETE USER
    // =========================================================

    @DeleteMapping("/users/{id}")
    public ResponseEntity<?> deleteUser(
            @PathVariable Long id) {

        if (!userRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }

        userRepository.deleteById(id);

        return ResponseEntity.noContent().build();
    }

    // =========================================================
    // CREATE USER REQUEST
    // =========================================================

    public static class CreateUserRequest {

        private String fullName;
        private String email;
        private String mobileNumber;
        private String password;
        private Role role;

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

        public Role getRole() {
            return role;
        }

        public void setRole(Role role) {
            this.role = role;
        }
    }

    // =========================================================
    // UPDATE USER REQUEST
    // =========================================================

    public static class UpdateUserRequest {

        private String fullName;
        private String email;
        private String mobileNumber;

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
    }

    // =========================================================
    // CHANGE PASSWORD REQUEST
    // =========================================================

    public static class ChangePasswordRequest {

        private String password;

        public String getPassword() {
            return password;
        }

        public void setPassword(String password) {
            this.password = password;
        }
    }
}