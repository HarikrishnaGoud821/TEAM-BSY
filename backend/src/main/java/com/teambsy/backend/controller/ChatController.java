package com.teambsy.backend.controller;

import com.teambsy.backend.dto.ChatConversationResponse;
import com.teambsy.backend.dto.ChatNotificationResponse;
import com.teambsy.backend.dto.ChatGroupCreateRequest;
import com.teambsy.backend.dto.ChatGroupMemberRequest;
import com.teambsy.backend.dto.ChatGroupMemberRoleRequest;
import com.teambsy.backend.dto.ChatGroupUpdateRequest;
import com.teambsy.backend.dto.ChatMemberResponse;
import com.teambsy.backend.dto.ChatMessageRequest;
import com.teambsy.backend.dto.ChatMessageResponse;
import com.teambsy.backend.dto.ChatPrivateConversationRequest;
import com.teambsy.backend.dto.ChatReactionRequest;
import com.teambsy.backend.dto.ChatReadRequest;
import com.teambsy.backend.dto.ChatReadReceiptResponse;
import com.teambsy.backend.dto.ChatUserResponse;
import com.teambsy.backend.dto.ChatWebSocketEvent;
import com.teambsy.backend.dto.ChatUploadLimitsResponse;
import com.teambsy.backend.entity.ChatMessageAttachment;
import com.teambsy.backend.service.ChatService;
import com.teambsy.backend.service.ChatFileStorageService;

import jakarta.validation.Valid;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import org.springframework.http.HttpStatus;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.core.io.Resource;
import org.springframework.security.core.Authentication;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/chat")
public class ChatController {

    private final ChatService chatService;
    private final ChatFileStorageService fileStorageService;
    private final SimpMessagingTemplate messagingTemplate;

    public ChatController(
            ChatService chatService,
            ChatFileStorageService fileStorageService,
            SimpMessagingTemplate messagingTemplate
    ) {
        this.chatService = chatService;
        this.fileStorageService = fileStorageService;
        this.messagingTemplate = messagingTemplate;
    }

    @GetMapping("/users/search")
    public ResponseEntity<List<ChatUserResponse>> searchUsers(
            @RequestParam String q,
            Authentication authentication
    ) {
        return ResponseEntity.ok(
                chatService.searchUsers(authentication.getName(), q)
        );
    }

    @GetMapping("/upload-limits")
    public ResponseEntity<ChatUploadLimitsResponse> getUploadLimits() {
        return ResponseEntity.ok(chatService.getUploadLimits());
    }

    @GetMapping("/conversations")
    public ResponseEntity<List<ChatConversationResponse>> getMyConversations(
            Authentication authentication
    ) {
        return ResponseEntity.ok(
                chatService.getMyConversations(authentication.getName())
        );
    }

    @GetMapping("/conversations/{conversationId}")
    public ResponseEntity<ChatConversationResponse> getConversation(
            @PathVariable String conversationId,
            Authentication authentication
    ) {
        return ResponseEntity.ok(
                chatService.getConversation(
                        conversationId,
                        authentication.getName()
                )
        );
    }

    @PostMapping("/private")
    public ResponseEntity<ChatConversationResponse> createPrivateConversation(
            @Valid @RequestBody ChatPrivateConversationRequest request,
            Authentication authentication
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(
                chatService.createPrivateConversation(
                        authentication.getName(),
                        request
                )
        );
    }

    @PostMapping("/groups")
    public ResponseEntity<ChatConversationResponse> createGroup(
            @Valid @RequestBody ChatGroupCreateRequest request,
            Authentication authentication
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(
                chatService.createGroup(
                        authentication.getName(),
                        request
                )
        );
    }

    @GetMapping("/{conversationId}/messages")
    public ResponseEntity<List<ChatMessageResponse>> getMessages(
            @PathVariable String conversationId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size,
            Authentication authentication
    ) {
        return ResponseEntity.ok(
                chatService.getMessages(
                        conversationId,
                        authentication.getName(),
                        page,
                        size
                )
        );
    }

    @GetMapping("/{conversationId}/messages/{messageId}")
    public ResponseEntity<ChatMessageResponse> getMessage(
            @PathVariable String conversationId,
            @PathVariable String messageId,
            Authentication authentication
    ) {
        return ResponseEntity.ok(
                chatService.getMessage(
                        conversationId,
                        messageId,
                        authentication.getName()
                )
        );
    }

    @PostMapping("/{conversationId}/messages")
    public ResponseEntity<ChatMessageResponse> sendMessage(
            @PathVariable String conversationId,
            @Valid @RequestBody ChatMessageRequest request,
            Authentication authentication
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(
                chatService.sendMessage(
                        conversationId,
                        authentication.getName(),
                        request
                )
        );
    }

    @PostMapping(
            path = "/{conversationId}/messages",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE
    )
    public ResponseEntity<ChatMessageResponse> sendMessageWithAttachments(
            @PathVariable String conversationId,
            @RequestParam(required = false) String content,
            @RequestParam(required = false) String replyToId,
            @RequestParam(name = "files", required = false)
            List<MultipartFile> files,
            Authentication authentication
    ) throws IOException {
        ChatMessageRequest request = new ChatMessageRequest();
        request.content = content;
        request.replyToId = replyToId;
        return ResponseEntity.status(HttpStatus.CREATED).body(
                chatService.sendMessageWithAttachments(
                        conversationId,
                        authentication.getName(),
                        request,
                        files
                )
        );
    }

    @PutMapping("/{conversationId}/messages/{messageId}")
    public ResponseEntity<ChatMessageResponse> editMessage(
            @PathVariable String conversationId,
            @PathVariable String messageId,
            @Valid @RequestBody ChatMessageRequest request,
            Authentication authentication
    ) {
        return ResponseEntity.ok(
                chatService.editMessage(
                        conversationId,
                        messageId,
                        authentication.getName(),
                        request
                )
        );
    }

    @DeleteMapping("/{conversationId}/messages/{messageId}")
    public ResponseEntity<Void> deleteMessage(
            @PathVariable String conversationId,
            @PathVariable String messageId,
            Authentication authentication
    ) {
        chatService.deleteMessage(
                conversationId,
                messageId,
                authentication.getName()
        );
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/attachments/{attachmentId}")
    public ResponseEntity<Resource> downloadAttachment(
            @PathVariable String attachmentId,
            Authentication authentication
    ) throws IOException {
        ChatMessageAttachment attachment = chatService.getAttachment(
                attachmentId,
                authentication.getName()
        );
        Resource resource = fileStorageService.load(attachment.getStorageKey());
        MediaType contentType = MediaType.parseMediaType(
                attachment.getMimeType()
        );
        ContentDisposition disposition = ContentDisposition.inline()
                .filename(attachment.getOriginalName(), StandardCharsets.UTF_8)
                .build();
        return ResponseEntity.ok()
                .contentType(contentType)
                .contentLength(attachment.getSizeBytes())
                .header(HttpHeaders.CONTENT_DISPOSITION, disposition.toString())
                .body(resource);
    }

    @GetMapping("/{conversationId}/members")
    public ResponseEntity<List<ChatMemberResponse>> getConversationMembers(
            @PathVariable String conversationId,
            Authentication authentication
    ) {
        return ResponseEntity.ok(
                chatService.getConversationMembers(
                        conversationId,
                        authentication.getName()
                )
        );
    }

    @PostMapping("/{conversationId}/read")
    public ResponseEntity<List<ChatReadReceiptResponse>> markMessagesRead(
            @PathVariable String conversationId,
            @Valid @RequestBody ChatReadRequest request,
            Authentication authentication
    ) {
        return ResponseEntity.ok(
                chatService.markMessagesRead(
                        conversationId,
                        authentication.getName(),
                        request
                )
        );
    }

    @GetMapping("/{conversationId}/messages/{messageId}/read-receipts")
    public ResponseEntity<List<ChatReadReceiptResponse>> getReadReceipts(
            @PathVariable String conversationId,
            @PathVariable String messageId,
            Authentication authentication
    ) {
        return ResponseEntity.ok(
                chatService.getReadReceipts(
                        conversationId,
                        messageId,
                        authentication.getName()
                )
        );
    }

    @PutMapping("/{conversationId}/group")
    public ResponseEntity<ChatConversationResponse> updateGroup(
            @PathVariable String conversationId,
            @Valid @RequestBody ChatGroupUpdateRequest request,
            Authentication authentication
    ) {
        ChatConversationResponse response = chatService.updateGroup(
                conversationId,
                authentication.getName(),
                request
        );
        publishToActiveMembers(
                conversationId,
                authentication.getName(),
                new ChatWebSocketEvent(
                        conversationId,
                        "GROUP_UPDATED",
                        response
                )
        );
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{conversationId}/members")
    public ResponseEntity<Void> addGroupMember(
            @PathVariable String conversationId,
            @Valid @RequestBody ChatGroupMemberRequest request,
            Authentication authentication
    ) {
        chatService.addGroupMember(
                conversationId,
                authentication.getName(),
                request
        );

        publishToActiveMembers(
                conversationId,
                authentication.getName(),
                new ChatWebSocketEvent(
                        conversationId,
                        "MEMBERS_UPDATED",
                        chatService.getConversationMembers(
                                conversationId,
                                authentication.getName()
                        )
                )
        );
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{conversationId}/members/{userId}")
    public ResponseEntity<Void> removeGroupMember(
            @PathVariable String conversationId,
            @PathVariable String userId,
            Authentication authentication
    ) {
        chatService.removeGroupMember(
                conversationId,
                authentication.getName(),
                userId
        );

        publishToActiveMembers(
                conversationId,
                authentication.getName(),
                new ChatWebSocketEvent(
                        conversationId,
                        "MEMBERS_UPDATED",
                        chatService.getConversationMembers(
                                conversationId,
                                authentication.getName()
                        )
                )
        );
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{conversationId}/members/{userId}/role")
    public ResponseEntity<Void> updateGroupMemberRole(
            @PathVariable String conversationId,
            @PathVariable String userId,
            @Valid @RequestBody ChatGroupMemberRoleRequest request,
            Authentication authentication
    ) {
        chatService.updateGroupMemberRole(
                conversationId,
                authentication.getName(),
                userId,
                request.role
        );
        publishToActiveMembers(
                conversationId,
                authentication.getName(),
                new ChatWebSocketEvent(
                        conversationId,
                        "MEMBERS_UPDATED",
                        chatService.getConversationMembers(
                                conversationId,
                                authentication.getName()
                        )
                )
        );
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{conversationId}/search")
    public ResponseEntity<List<ChatMessageResponse>> searchMessages(
            @PathVariable String conversationId,
            @RequestParam String q,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size,
            Authentication authentication
    ) {
        return ResponseEntity.ok(
                chatService.searchMessages(
                        conversationId,
                        authentication.getName(),
                        q,
                        page,
                        size
                )
        );
    }

    @PostMapping("/{conversationId}/messages/{messageId}/reactions")
    public ResponseEntity<Boolean> toggleReaction(
            @PathVariable String conversationId,
            @PathVariable String messageId,
            @Valid @RequestBody ChatReactionRequest request,
            Authentication authentication
    ) {
        return ResponseEntity.ok(
                chatService.toggleReaction(
                        conversationId,
                        messageId,
                        authentication.getName(),
                        request.emoji
                )
        );
    }

    @GetMapping("/{conversationId}/messages/{messageId}/reactions")
    public ResponseEntity<List<com.teambsy.backend.dto.ChatReactionResponse>>
    getReactions(
            @PathVariable String conversationId,
            @PathVariable String messageId,
            Authentication authentication
    ) {
        return ResponseEntity.ok(
                chatService.getReactions(
                        conversationId,
                        messageId,
                        authentication.getName()
                )
        );
    }

    @GetMapping("/notifications")
    public ResponseEntity<List<ChatNotificationResponse>> getNotifications(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size,
            Authentication authentication
    ) {
        return ResponseEntity.ok(
                chatService.getNotifications(
                        authentication.getName(),
                        page,
                        size
                )
        );
    }

    @GetMapping("/notifications/unread-count")
    public ResponseEntity<Long> getUnreadNotificationCount(
            Authentication authentication
    ) {
        return ResponseEntity.ok(
                chatService.getUnreadNotificationCount(
                        authentication.getName()
                )
        );
    }

    @PostMapping("/notifications/{notificationId}/read")
    public ResponseEntity<Void> markNotificationRead(
            @PathVariable String notificationId,
            Authentication authentication
    ) {
        chatService.markNotificationRead(
                notificationId,
                authentication.getName()
        );
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/notifications/read-all")
    public ResponseEntity<Void> markAllNotificationsRead(
            Authentication authentication
    ) {
        chatService.markAllNotificationsRead(authentication.getName());
        return ResponseEntity.noContent().build();
    }

    private void publishToActiveMembers(
            String conversationId,
            String currentUserId,
            ChatWebSocketEvent event
    ) {
        chatService.getActiveMembersForBroadcast(conversationId)
                .forEach(member -> messagingTemplate.convertAndSendToUser(
                        member.userId,
                        "/queue/chat",
                        event
                ));
    }
}