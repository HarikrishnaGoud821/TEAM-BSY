package com.teambsy.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public class ChatGroupMemberRoleRequest {

    @NotBlank(message = "Select a group member role")
    @Pattern(
            regexp = "ADMIN|MEMBER",
            message = "Role must be ADMIN or MEMBER"
    )
    public String role;
}
