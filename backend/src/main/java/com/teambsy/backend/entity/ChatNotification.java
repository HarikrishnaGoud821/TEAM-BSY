package com.teambsy.backend.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(
    name = "chat_notifications",
    indexes = {
        @Index(name = "idx_chat_notification_user", columnList = "user_id"),
        @Index(name = "idx_chat_notification_created", columnList = "created_at")
    }
)
public class ChatNotification {

    @Id
    @Column(length = 36, nullable = false, updatable = false)
    private String id;

    @Column(name = "user_id", nullable = false, length = 36)
    private String userId;

    @Column(name = "conversation_id", nullable = false, length = 36)
    private String conversationId;

    @Column(name = "message_id", length = 36)
    private String messageId;

    @Column(nullable = false, length = 50)
    private String type;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "read_at")
    private LocalDateTime readAt;

    public ChatNotification() {
    }

    @PrePersist
    protected void onCreate() {
        if (id == null) {
            id = UUID.randomUUID().toString();
        }

        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }

    public String getId() { return id; }
    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }
    public String getConversationId() { return conversationId; }
    public void setConversationId(String conversationId) { this.conversationId = conversationId; }
    public String getMessageId() { return messageId; }
    public void setMessageId(String messageId) { this.messageId = messageId; }
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getReadAt() { return readAt; }
    public void setReadAt(LocalDateTime readAt) { this.readAt = readAt; }
}