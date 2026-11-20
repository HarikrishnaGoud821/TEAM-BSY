package com.teambsy.backend.dto;

import com.teambsy.backend.entity.ChatMessageReaction;
import java.time.LocalDateTime;

public class ChatReactionResponse {

    public String id;
    public String messageId;
    public String userId;
    public String userName;
    public String emoji;
    public LocalDateTime createdAt;

    public ChatReactionResponse(
            ChatMessageReaction reaction,
            String userName
    ) {
        this.id = reaction.getId();
        this.messageId = reaction.getMessageId();
        this.userId = reaction.getUserId();
        this.userName = userName;
        this.emoji = reaction.getEmoji();
        this.createdAt = reaction.getCreatedAt();
    }
}