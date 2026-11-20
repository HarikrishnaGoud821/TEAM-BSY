package com.teambsy.backend.dto;

import com.teambsy.backend.entity.ChatMessage;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

public class ChatMessageResponse {

    public String id;
    public String conversationId;
    public String senderId;
    public String senderName;
    public String content;
    public String replyToId;
    public LocalDateTime createdAt;
    public LocalDateTime editedAt;
    public boolean deleted;
    public List<ChatAttachmentResponse> attachments = new ArrayList<>();
    public List<ChatReactionResponse> reactions = new ArrayList<>();
    public List<ChatReadReceiptResponse> readReceipts = new ArrayList<>();
    public ChatReplyPreviewResponse replyPreview;

    public ChatMessageResponse(ChatMessage message, String senderName) {
        this.id = message.getId();
        this.conversationId = message.getConversationId();
        this.senderId = message.getSenderId();
        this.senderName = senderName;
        this.content = message.getContent();
        this.replyToId = message.getReplyToId();
        this.createdAt = message.getCreatedAt();
        this.editedAt = message.getEditedAt();
        this.deleted = message.getDeletedAt() != null;
    }
}