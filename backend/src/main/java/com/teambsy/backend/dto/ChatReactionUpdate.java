package com.teambsy.backend.dto;

import java.util.List;

public class ChatReactionUpdate {

    public String messageId;
    public List<ChatReactionResponse> reactions;

    public ChatReactionUpdate(
            String messageId,
            List<ChatReactionResponse> reactions
    ) {
        this.messageId = messageId;
        this.reactions = reactions;
    }
}
