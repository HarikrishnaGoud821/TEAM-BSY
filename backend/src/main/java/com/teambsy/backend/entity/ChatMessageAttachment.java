package com.teambsy.backend.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(
    name = "chat_message_attachments",
    indexes = {
        @Index(name = "idx_chat_attachment_message", columnList = "message_id")
    }
)
public class ChatMessageAttachment {

    @Id
    @Column(length = 36, nullable = false, updatable = false)
    private String id;

    @Column(name = "message_id", nullable = false, length = 36)
    private String messageId;

    @Column(name = "storage_key", nullable = false, length = 500)
    private String storageKey;

    @Column(name = "original_name", nullable = false, length = 255)
    private String originalName;

    @Column(name = "mime_type", nullable = false, length = 150)
    private String mimeType;

    @Column(name = "size_bytes", nullable = false)
    private Long sizeBytes;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    public ChatMessageAttachment() {
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
    public String getStorageKey() { return storageKey; }
    public void setStorageKey(String storageKey) { this.storageKey = storageKey; }
    public String getOriginalName() { return originalName; }
    public void setOriginalName(String originalName) { this.originalName = originalName; }
    public String getMimeType() { return mimeType; }
    public void setMimeType(String mimeType) { this.mimeType = mimeType; }
    public Long getSizeBytes() { return sizeBytes; }
    public void setSizeBytes(Long sizeBytes) { this.sizeBytes = sizeBytes; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}