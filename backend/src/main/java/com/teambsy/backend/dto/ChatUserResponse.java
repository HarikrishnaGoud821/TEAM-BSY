package com.teambsy.backend.dto;

public class ChatUserResponse {

    public String id;
    public String fullName;

    public ChatUserResponse(String id, String fullName) {
        this.id = id;
        this.fullName = fullName;
    }
}
