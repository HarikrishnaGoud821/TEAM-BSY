package com.teambsy.backend.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(
    name = "chat_message_reads",
    uniqueConstraints = {
        @UniqueConstraint(
            name = "uk_chat_message_read_user",
            columnNames = {"message_id", "user_id"}
        )
    },
    indexes = {
        @Index(name = "idx_chat_read_user", columnList = "user_id")
    }
)
public class ChatMessageRead {

    @Id
    @Column(length = 36, nullable = false, updatable = false)
    private String id;

    @Column(name = "message_id", nullable = false, length = 36)
    private String messageId;

    @Column(name = "user_id", nullable = false, length = 36)
    private String userId;

    @Column(name = "read_at", nullable = false)
    private LocalDateTime readAt;

    public ChatMessageRead() {
    }

    @PrePersist
    protected void onCreate() {
        if (id == null) {
            id = UUID.randomUUID().toString();
        }

        if (readAt == null) {
            readAt = LocalDateTime.now();
        }
    }

    public String getId() { return id; }
    public String getMessageId() { return messageId; }
    public void setMessageId(String messageId) { this.messageId = messageId; }
    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }
    public LocalDateTime getReadAt() { return readAt; }
}