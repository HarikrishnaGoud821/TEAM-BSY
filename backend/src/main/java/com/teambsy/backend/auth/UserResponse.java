package com.teambsy.backend.auth;

import com.teambsy.backend.model.Role;
import com.teambsy.backend.model.User;

public class UserResponse {

    private Long id;
    private String fullName;
    private String email;
    private String mobileNumber;
    private Role role;
    private boolean enabled;

    public UserResponse() {
    }

    public UserResponse(
            Long id,
            String fullName,
            String email,
            String mobileNumber,
            Role role,
            boolean enabled) {

        this.id = id;
        this.fullName = fullName;
        this.email = email;
        this.mobileNumber = mobileNumber;
        this.role = role;
        this.enabled = enabled;
    }

    public static UserResponse from(User user) {

        return new UserResponse(
                user.getId(),
                user.getFullName(),
                user.getEmail(),
                user.getMobileNumber(),
                user.getRole(),
                user.isEnabled()
        );
    }

    public Long getId() {
        return id;
    }

    public String getFullName() {
        return fullName;
    }

    public String getEmail() {
        return email;
    }

    public String getMobileNumber() {
        return mobileNumber;
    }

    public Role getRole() {
        return role;
    }

    public boolean isEnabled() {
        return enabled;
    }
}