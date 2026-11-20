package com.teambsy.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class ChatPrivateConversationRequest {

    @NotBlank(message = "Select a user")
    @Size(max = 36, message = "Invalid user ID")
    public String targetUserId;
}