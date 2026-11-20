package com.teambsy.backend.dto;

import java.time.LocalDateTime;

public class ChatReadReceiptResponse {

    public String messageId;
    public String userId;
    public String userName;
    public LocalDateTime readAt;

    public ChatReadReceiptResponse(
            String messageId,
            String userId,
            String userName,
            LocalDateTime readAt
    ) {
        this.messageId = messageId;
        this.userId = userId;
        this.userName = userName;
        this.readAt = readAt;
    }
}