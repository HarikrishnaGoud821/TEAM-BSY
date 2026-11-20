package com.teambsy.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class ChatReactionRequest {

    @NotBlank(message = "Select an emoji")
    @Size(max = 32, message = "Invalid emoji")
    public String emoji;
}