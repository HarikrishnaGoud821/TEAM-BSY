package com.teambsy.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.List;

public class ChatGroupCreateRequest {

    @NotBlank(message = "Enter a group name")
    @Size(max = 150, message = "Group name is too long")
    public String name;

    @Size(max = 1000, message = "Description is too long")
    public String description;

    @Size(max = 200, message = "Too many group members")
    public List<@NotBlank @Size(max = 36) String> memberIds;
}