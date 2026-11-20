package com.teambsy.backend.dto;

import com.teambsy.backend.entity.AppUser;
import com.teambsy.backend.entity.Profile;
import com.teambsy.backend.entity.UserRole;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;

public class AdminUserResponse {

    public String id;
    public String email;
    public String full_name;
    public String mobile;
    public String village;
    public LocalDateTime created_at;
    public boolean active;
    public List<String> roles;

    public AdminUserResponse(
            AppUser user,
            Profile profile,
            List<UserRole> roles
    ) {
        this.id = user.getId();
        this.email = user.getEmail();
        this.full_name = profile == null ? null : profile.getFullName();
        this.mobile = profile == null ? null : profile.getMobile();
        this.village = profile == null ? null : profile.getVillage();
        this.created_at = user.getCreatedAt();
        this.active = user.isActive();
        this.roles = roles.stream()
                .map(role -> role.getRole().name().toLowerCase(Locale.ROOT))
                .toList();
    }
}
