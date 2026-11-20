package com.teambsy.backend.dto;

import com.teambsy.backend.entity.ChatNotification;
import java.time.LocalDateTime;

public class ChatNotificationResponse {

    public String id;
    public String conversationId;
    public String messageId;
    public String type;
    public LocalDateTime createdAt;
    public LocalDateTime readAt;
    public boolean read;

    public ChatNotificationResponse(ChatNotification notification) {
        this.id = notification.getId();
        this.conversationId = notification.getConversationId();
        this.messageId = notification.getMessageId();
        this.type = notification.getType();
        this.createdAt = notification.getCreatedAt();
        this.readAt = notification.getReadAt();
        this.read = notification.getReadAt() != null;
    }
}