package com.teambsy.backend.dto;

import com.teambsy.backend.entity.ChatConversation;
import java.time.LocalDateTime;

public class ChatConversationResponse {

    public String id;
    public String type;
    public String name;
    public String displayName;
    public String otherUserId;
    public String description;
    public boolean onlyAdminsCanSend;
    public String createdBy;
    public LocalDateTime createdAt;
    public LocalDateTime updatedAt;
    public ChatMessageResponse latestMessage;
    public long unreadCount;

    public ChatConversationResponse(ChatConversation conversation) {
        this.id = conversation.getId();
        this.type = conversation.getType().name();
        this.name = conversation.getName();
        this.description = conversation.getDescription();
        this.onlyAdminsCanSend = conversation.isOnlyAdminsCanSend();
        this.createdBy = conversation.getCreatedBy();
        this.createdAt = conversation.getCreatedAt();
        this.updatedAt = conversation.getUpdatedAt();
    }
}