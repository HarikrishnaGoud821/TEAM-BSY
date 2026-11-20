package com.teambsy.backend.dto;

public class ChatReplyPreviewResponse {

    public String id;
    public String senderId;
    public String senderName;
    public String content;
    public boolean deleted;

    public ChatReplyPreviewResponse(
            String id,
            String senderId,
            String senderName,
            String content,
            boolean deleted
    ) {
        this.id = id;
        this.senderId = senderId;
        this.senderName = senderName;
        this.content = content;
        this.deleted = deleted;
    }
}
