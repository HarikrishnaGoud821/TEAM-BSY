package com.teambsy.backend.controller;

import com.teambsy.backend.model.Role;
import com.teambsy.backend.model.User;
import com.teambsy.backend.repository.UserRepository;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/roles")
public class RoleController {

    private final UserRepository userRepository;

    public RoleController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @GetMapping
    public Role[] getRoles() {
        return Role.values();
    }

    @GetMapping("/{role}/users")
    public List<User> getUsersByRole(@PathVariable Role role) {
        return userRepository.findByRole(role);
    }

    @GetMapping("/{role}/count")
    public long getRoleCount(@PathVariable Role role) {
        return userRepository.countByRole(role);
    }
}