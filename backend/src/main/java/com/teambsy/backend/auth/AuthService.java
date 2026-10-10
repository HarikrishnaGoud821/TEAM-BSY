package com.teambsy.backend.auth;

import com.teambsy.backend.model.Role;
import com.teambsy.backend.model.User;
import com.teambsy.backend.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public AuthService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder
    ) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public User register(RegisterRequest request) {

        if (request.getMobileNumber() != null
                && userRepository.findByMobileNumber(request.getMobileNumber()).isPresent()) {
            throw new RuntimeException("Mobile number already registered");
        }

        if (request.getEmail() != null
                && userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new RuntimeException("Email already registered");
        }

        User user = new User();

        user.setFullName(request.getFullName());
        user.setEmail(request.getEmail());
        user.setMobileNumber(request.getMobileNumber());

        if (request.getPassword() != null) {
            user.setPassword(
                    passwordEncoder.encode(request.getPassword())
            );
        }

        // Every normal registration starts as MEMBER.
        user.setRole(Role.MEMBER);

        return userRepository.save(user);
    }
}