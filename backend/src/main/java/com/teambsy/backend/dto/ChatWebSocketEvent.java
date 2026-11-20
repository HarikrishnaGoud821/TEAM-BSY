package com.teambsy.backend.dto;

public class ChatWebSocketEvent {

    public String conversationId;
    public String type;
    public Object payload;

    public ChatWebSocketEvent(String type, Object payload) {
        this(null, type, payload);
    }

    public ChatWebSocketEvent(
            String conversationId,
            String type,
            Object payload
    ) {
        this.conversationId = conversationId;
        this.type = type;
        this.payload = payload;
    }
}
