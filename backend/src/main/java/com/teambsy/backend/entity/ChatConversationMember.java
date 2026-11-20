package com.teambsy.backend.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(
    name = "chat_conversation_members",
    uniqueConstraints = {
        @UniqueConstraint(
            name = "uk_chat_conversation_member",
            columnNames = {"conversation_id", "user_id"}
        )
    },
    indexes = {
        @Index(name = "idx_chat_member_user", columnList = "user_id"),
        @Index(name = "idx_chat_member_conversation", columnList = "conversation_id")
    }
)
public class ChatConversationMember {

    @Id
    @Column(length = 36, nullable = false, updatable = false)
    private String id;

    @Column(name = "conversation_id", nullable = false, length = 36)
    private String conversationId;

    @Column(name = "user_id", nullable = false, length = 36)
    private String userId;

    @Column(name = "added_by", nullable = false, length = 36)
    private String addedBy;

    @Column(name = "member_role", nullable = false, length = 20)
    private String memberRole = "MEMBER";

    @Column(name = "joined_at", nullable = false)
    private LocalDateTime joinedAt;

    @Column(name = "last_read_at")
    private LocalDateTime lastReadAt;

    @Column(nullable = false)
    private boolean active = true;

    public ChatConversationMember() {
    }

    @PrePersist
    protected void onCreate() {
        if (id == null) {
            id = UUID.randomUUID().toString();
        }

        if (joinedAt == null) {
            joinedAt = LocalDateTime.now();
        }
    }

    public String getId() { return id; }
    public String getConversationId() { return conversationId; }
    public void setConversationId(String conversationId) { this.conversationId = conversationId; }
    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }
    public String getAddedBy() { return addedBy; }
    public void setAddedBy(String addedBy) { this.addedBy = addedBy; }
    public String getMemberRole() { return memberRole; }
    public void setMemberRole(String memberRole) { this.memberRole = memberRole; }
    public LocalDateTime getJoinedAt() { return joinedAt; }
    public LocalDateTime getLastReadAt() { return lastReadAt; }
    public void setLastReadAt(LocalDateTime lastReadAt) { this.lastReadAt = lastReadAt; }
    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }
}