package com.teambsy.backend.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(
    name = "chat_messages",
    indexes = {
        @Index(name = "idx_chat_message_conversation", columnList = "conversation_id"),
        @Index(name = "idx_chat_message_sender", columnList = "sender_id"),
        @Index(name = "idx_chat_message_created", columnList = "created_at")
    }
)
public class ChatMessage {

    @Id
    @Column(length = 36, nullable = false, updatable = false)
    private String id;

    @Column(name = "conversation_id", nullable = false, length = 36)
    private String conversationId;

    @Column(name = "sender_id", nullable = false, length = 36)
    private String senderId;

    @Column(columnDefinition = "TEXT")
    private String content;

    @Column(name = "reply_to_id", length = 36)
    private String replyToId;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "edited_at")
    private LocalDateTime editedAt;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    public ChatMessage() {
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
    public String getConversationId() { return conversationId; }
    public void setConversationId(String conversationId) { this.conversationId = conversationId; }
    public String getSenderId() { return senderId; }
    public void setSenderId(String senderId) { this.senderId = senderId; }
    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }
    public String getReplyToId() { return replyToId; }
    public void setReplyToId(String replyToId) { this.replyToId = replyToId; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getEditedAt() { return editedAt; }
    public void setEditedAt(LocalDateTime editedAt) { this.editedAt = editedAt; }
    public LocalDateTime getDeletedAt() { return deletedAt; }
    public void setDeletedAt(LocalDateTime deletedAt) { this.deletedAt = deletedAt; }
}