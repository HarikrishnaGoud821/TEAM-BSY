
package com.teambsy.backend.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(
    name = "user_roles",
    uniqueConstraints = {
        @UniqueConstraint(
            name = "uk_user_role",
            columnNames = {"user_id", "role"}
        )
    }
)
public class UserRole {

    @Id
    @Column(length = 36, nullable = false, updatable = false)
    private String id;

    @Column(name = "user_id", nullable = false, length = 36)
    private String userId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private AppRole role;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    public UserRole() {
    }

    @PrePersist
    protected void onCreate() {
        if (id == null) {
            id = UUID.randomUUID().toString();
        }

        createdAt = LocalDateTime.now();
    }

    public String getId() {
        return id;
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public AppRole getRole() {
        return role;
    }

    public void setRole(AppRole role) {
        this.role = role;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
}
