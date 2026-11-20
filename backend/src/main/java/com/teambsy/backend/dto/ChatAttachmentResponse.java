package com.teambsy.backend.dto;

import com.teambsy.backend.entity.ChatMessageAttachment;

import java.time.LocalDateTime;

public class ChatAttachmentResponse {

    public String id;
    public String messageId;
    public String originalName;
    public String mimeType;
    public Long sizeBytes;
    public String downloadUrl;
    public LocalDateTime createdAt;

    public ChatAttachmentResponse(ChatMessageAttachment attachment) {
        this.id = attachment.getId();
        this.messageId = attachment.getMessageId();
        this.originalName = attachment.getOriginalName();
        this.mimeType = attachment.getMimeType();
        this.sizeBytes = attachment.getSizeBytes();
        this.downloadUrl = "/api/chat/attachments/" + attachment.getId();
        this.createdAt = attachment.getCreatedAt();
    }
}