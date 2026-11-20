package com.teambsy.backend.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(
    name = "chat_message_reactions",
    uniqueConstraints = {
        @UniqueConstraint(
            name = "uk_chat_message_user_emoji",
            columnNames = {"message_id", "user_id", "emoji"}
        )
    },
    indexes = {
        @Index(name = "idx_chat_reaction_message", columnList = "message_id")
    }
)
public class ChatMessageReaction {

    @Id
    @Column(length = 36, nullable = false, updatable = false)
    private String id;

    @Column(name = "message_id", nullable = false, length = 36)
    private String messageId;

    @Column(name = "user_id", nullable = false, length = 36)
    private String userId;

    @Column(nullable = false, length = 32)
    private String emoji;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    public ChatMessageReaction() {
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
    public String getMessageId() { return messageId; }
    public void setMessageId(String messageId) { this.messageId = messageId; }
    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }
    public String getEmoji() { return emoji; }
    public void setEmoji(String emoji) { this.emoji = emoji; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}