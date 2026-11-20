package com.teambsy.backend.controller;

import com.teambsy.backend.dto.ChatMessageRequest;
import com.teambsy.backend.dto.ChatReactionRequest;
import com.teambsy.backend.dto.ChatReadRequest;
import com.teambsy.backend.dto.ChatReadReceiptResponse;
import com.teambsy.backend.dto.ChatWebSocketMessageRequest;
import com.teambsy.backend.service.ChatService;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Controller;
import org.springframework.validation.annotation.Validated;

import jakarta.validation.Valid;
import java.security.Principal;

@Controller
@Validated
public class ChatWebSocketController {

    private final ChatService chatService;

    public ChatWebSocketController(ChatService chatService) {
        this.chatService = chatService;
    }

    @MessageMapping("/chat/{conversationId}/send")
    public void sendMessage(
            @DestinationVariable String conversationId,
            @Valid ChatWebSocketMessageRequest request,
            Principal principal
    ) {
        String userId = requireUser(principal);
        ChatMessageRequest messageRequest = new ChatMessageRequest();
        messageRequest.content = request.content;
        messageRequest.replyToId = request.replyToId;
        chatService.sendMessage(
                conversationId,
                userId,
                messageRequest
        );
    }

    @MessageMapping("/chat/{conversationId}/messages/{messageId}/react")
    public void toggleReaction(
            @DestinationVariable String conversationId,
            @DestinationVariable String messageId,
            @Valid ChatReactionRequest request,
            Principal principal
    ) {
        String userId = requireUser(principal);
        if (request == null) {
            throw new IllegalArgumentException("Select an emoji");
        }
        chatService.toggleReaction(
                conversationId,
                messageId,
                userId,
                request.emoji
        );
    }

    @MessageMapping("/chat/{conversationId}/read")
    public void markMessagesRead(
            @DestinationVariable String conversationId,
            @Valid ChatReadRequest request,
            Principal principal
    ) {
        String userId = requireUser(principal);
        chatService.markMessagesRead(
                conversationId,
                userId,
                request
        );
    }

    private String requireUser(Principal principal) {
        if (principal == null || principal.getName() == null) {
            throw new AccessDeniedException("Authenticated chat session required");
        }
        return principal.getName();
    }
}
