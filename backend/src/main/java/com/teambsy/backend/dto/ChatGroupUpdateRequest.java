package com.teambsy.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class ChatGroupUpdateRequest {

    @NotBlank(message = "Enter a group name")
    @Size(max = 150, message = "Group name is too long")
    public String name;

    @Size(max = 1000, message = "Description is too long")
    public String description;

    public Boolean onlyAdminsCanSend;
}