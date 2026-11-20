package com.teambsy.backend.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(
        name = "audit_logs",
        indexes = {
                @Index(name = "idx_audit_created_at", columnList = "created_at")
        }
)
public class AuditLog {

    @Id
    @Column(length = 36, nullable = false, updatable = false)
    private String id;

    @Column(name = "user_id", length = 36)
    private String userId;

    @Column(nullable = false, length = 150)
    private String action;

    @Column(length = 100)
    private String entity;

    @Column(name = "entity_id", length = 36)
    private String entityId;

    @Column(columnDefinition = "TEXT")
    private String details;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    public AuditLog() {
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
    public String getAction() { return action; }
    public void setAction(String action) { this.action = action; }
    public String getEntity() { return entity; }
    public void setEntity(String entity) { this.entity = entity; }
    public String getEntityId() { return entityId; }
    public void setEntityId(String entityId) { this.entityId = entityId; }
    public String getDetails() { return details; }
    public void setDetails(String details) { this.details = details; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}
