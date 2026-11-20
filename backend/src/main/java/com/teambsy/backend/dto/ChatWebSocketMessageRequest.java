package com.teambsy.backend.dto;

import jakarta.validation.constraints.Size;

public class ChatWebSocketMessageRequest {

    @Size(max = 10000, message = "Message is too long")
    public String content;

    @Size(max = 36, message = "Invalid reply message ID")
    public String replyToId;
}