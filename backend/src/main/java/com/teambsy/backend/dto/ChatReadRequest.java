package com.teambsy.backend.dto;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import java.util.List;

public class ChatReadRequest {

    @NotEmpty
    @Size(max = 100)
    public List<@Size(max = 36) String> messageIds;
}