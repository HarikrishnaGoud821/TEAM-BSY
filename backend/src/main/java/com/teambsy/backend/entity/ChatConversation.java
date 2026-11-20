package com.teambsy.backend.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(
    name = "chat_conversations",
    indexes = {
        @Index(name = "idx_chat_conversation_type", columnList = "type")
    }
)
public class ChatConversation {

    @Id
    @Column(length = 36, nullable = false, updatable = false)
    private String id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ChatConversationType type;

    @Column(length = 150)
    private String name;

    @Column(length = 1000)
    private String description;

    @Column(
        name = "only_admins_can_send",
        nullable = false,
        columnDefinition = "boolean default false"
    )
    private boolean onlyAdminsCanSend;

    @Column(name = "private_key", unique = true, length = 73)
    private String privateKey;

    @Column(name = "created_by", nullable = false, length = 36)
    private String createdBy;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @Column(name = "archived_at")
    private LocalDateTime archivedAt;

    public ChatConversation() {
    }

    @PrePersist
    protected void onCreate() {
        if (id == null) {
            id = UUID.randomUUID().toString();
        }

        LocalDateTime now = LocalDateTime.now();

        if (createdAt == null) {
            createdAt = now;
        }

        if (updatedAt == null) {
            updatedAt = now;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public String getId() { return id; }
    public ChatConversationType getType() { return type; }
    public void setType(ChatConversationType type) { this.type = type; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public boolean isOnlyAdminsCanSend() { return onlyAdminsCanSend; }
    public void setOnlyAdminsCanSend(boolean onlyAdminsCanSend) {
        this.onlyAdminsCanSend = onlyAdminsCanSend;
    }
    public String getPrivateKey() { return privateKey; }
    public void setPrivateKey(String privateKey) { this.privateKey = privateKey; }
    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public LocalDateTime getArchivedAt() { return archivedAt; }
    public void setArchivedAt(LocalDateTime archivedAt) { this.archivedAt = archivedAt; }
}