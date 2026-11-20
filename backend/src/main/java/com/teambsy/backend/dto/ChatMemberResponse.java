package com.teambsy.backend.dto;

import java.time.LocalDateTime;

public class ChatMemberResponse {

    public String userId;
    public String fullName;
    public String mobile;
    public String memberRole;
    public LocalDateTime joinedAt;
    public boolean online;
    public LocalDateTime lastSeenAt;

    public ChatMemberResponse(
            String userId,
            String fullName,
            String mobile,
            String memberRole,
            LocalDateTime joinedAt,
            boolean online
    ) {
        this.userId = userId;
        this.fullName = fullName;
        this.mobile = mobile;
        this.memberRole = memberRole;
        this.joinedAt = joinedAt;
        this.online = online;
    }

    public void setPresence(boolean online, LocalDateTime lastSeenAt) {
        this.online = online;
        this.lastSeenAt = lastSeenAt;
    }
}