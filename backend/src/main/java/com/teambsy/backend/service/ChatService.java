package com.teambsy.backend.service;

import java.util.Comparator;
import java.util.ArrayList;
import java.util.HashSet;
import java.time.LocalDateTime;

import org.springframework.data.domain.PageRequest;

import com.teambsy.backend.dto.ChatMessageResponse;
import com.teambsy.backend.dto.ChatMessageRequest;
import com.teambsy.backend.dto.ChatReadRequest;
import com.teambsy.backend.dto.ChatReadReceiptResponse;

import com.teambsy.backend.dto.ChatConversationResponse;
import com.teambsy.backend.dto.ChatMemberResponse;
import com.teambsy.backend.dto.ChatGroupCreateRequest;
import com.teambsy.backend.dto.ChatGroupMemberRequest;
import com.teambsy.backend.dto.ChatGroupUpdateRequest;
import com.teambsy.backend.dto.ChatPrivateConversationRequest;
import com.teambsy.backend.entity.AppRole;
import com.teambsy.backend.entity.AppUser;
import com.teambsy.backend.entity.ChatConversation;
import com.teambsy.backend.entity.ChatMessage;
import com.teambsy.backend.entity.ChatMessageRead;
import com.teambsy.backend.entity.ChatNotification;
import com.teambsy.backend.entity.ChatConversationMember;
import com.teambsy.backend.entity.ChatConversationType;
import com.teambsy.backend.entity.Profile;
import com.teambsy.backend.repository.AppUserRepository;
import com.teambsy.backend.repository.ChatConversationMemberRepository;
import com.teambsy.backend.repository.ChatConversationRepository;
import com.teambsy.backend.repository.ChatMessageRepository;
import com.teambsy.backend.repository.ChatMessageReactionRepository;
import com.teambsy.backend.repository.ChatMessageReadRepository;
import com.teambsy.backend.repository.ChatNotificationRepository;
import com.teambsy.backend.repository.ProfileRepository;
import com.teambsy.backend.repository.UserRoleRepository;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.io.IOException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import com.teambsy.backend.dto.ChatAttachmentResponse;
import com.teambsy.backend.dto.ChatNotificationResponse;
import com.teambsy.backend.dto.ChatWebSocketEvent;
import com.teambsy.backend.dto.ChatUploadLimitsResponse;
import com.teambsy.backend.dto.ChatReplyPreviewResponse;
import com.teambsy.backend.dto.ChatReactionResponse;
import com.teambsy.backend.dto.ChatReactionUpdate;
import com.teambsy.backend.dto.ChatUserResponse;
import com.teambsy.backend.entity.ChatMessageAttachment;
import com.teambsy.backend.repository.ChatMessageAttachmentRepository;

@Service
public class ChatService {

    private static final Logger logger =
            LoggerFactory.getLogger(ChatService.class);

    private final ChatConversationRepository conversationRepository;
    private final ChatMessageRepository messageRepository;
    private final ChatMessageReactionRepository reactionRepository;
    private final ChatMessageReadRepository readRepository;
    private final ChatNotificationRepository notificationRepository;
    private final ChatConversationMemberRepository memberRepository;
    private final AppUserRepository appUserRepository;
    private final ProfileRepository profileRepository;
    private final UserRoleRepository userRoleRepository;
    private final ChatMessageAttachmentRepository attachmentRepository;
    private final ChatFileStorageService fileStorageService;
    private final ChatPresenceService presenceService;
    private final SimpMessagingTemplate messagingTemplate;
    private final int maxFilesPerMessage;
    private final long maxFileSizeBytes;

    public ChatService(
            ChatConversationRepository conversationRepository,
            ChatMessageRepository messageRepository,
            ChatMessageReactionRepository reactionRepository,
            ChatMessageReadRepository readRepository,
            ChatNotificationRepository notificationRepository,
            ChatConversationMemberRepository memberRepository,
            AppUserRepository appUserRepository,
            ProfileRepository profileRepository,
            UserRoleRepository userRoleRepository,
            ChatMessageAttachmentRepository attachmentRepository,
            ChatFileStorageService fileStorageService,
            ChatPresenceService presenceService,
            SimpMessagingTemplate messagingTemplate,
            @Value("${team-bsy.chat.max-file-size:20971520}")
            long maxFileSizeBytes,
            @Value("${team-bsy.chat.max-files-per-message:10}")
            int maxFilesPerMessage
    ) {
        this.conversationRepository = conversationRepository;
        this.messageRepository = messageRepository;
        this.reactionRepository = reactionRepository;
        this.readRepository = readRepository;
        this.notificationRepository = notificationRepository;
        this.memberRepository = memberRepository;
        this.appUserRepository = appUserRepository;
        this.profileRepository = profileRepository;
        this.userRoleRepository = userRoleRepository;
        this.attachmentRepository = attachmentRepository;
        this.fileStorageService = fileStorageService;
        this.presenceService = presenceService;
        this.messagingTemplate = messagingTemplate;
        this.maxFileSizeBytes = maxFileSizeBytes;
        this.maxFilesPerMessage = maxFilesPerMessage;
    }

    @Transactional
    public ChatConversationResponse createPrivateConversation(
            String currentUserId,
            ChatPrivateConversationRequest request
    ) {
        if (request == null || request.targetUserId == null ||
                request.targetUserId.isBlank()) {
            throw new IllegalArgumentException("Select a user");
        }

        String targetUserId = request.targetUserId.trim();

        if (currentUserId.equals(targetUserId)) {
            throw new IllegalArgumentException(
                    "You cannot create a conversation with yourself"
            );
        }

        validateActiveUser(currentUserId);
        validateActiveUser(targetUserId);

        String privateKey = currentUserId.compareTo(targetUserId) < 0
                ? currentUserId + ":" + targetUserId
                : targetUserId + ":" + currentUserId;

        var existing = conversationRepository.findByPrivateKey(privateKey);

        if (existing.isPresent()) {
            ChatConversation conversation = existing.get();

            if (conversation.getArchivedAt() == null) {
                return new ChatConversationResponse(conversation);
            }

            throw new IllegalArgumentException(
                    "This private conversation is archived"
            );
        }

        ChatConversation conversation = new ChatConversation();
        conversation.setType(ChatConversationType.PRIVATE);
        conversation.setPrivateKey(privateKey);
        conversation.setCreatedBy(currentUserId);

        conversation = conversationRepository.save(conversation);

        addMember(conversation.getId(), currentUserId, currentUserId, "MEMBER");
        addMember(conversation.getId(), targetUserId, currentUserId, "MEMBER");

        return new ChatConversationResponse(conversation);
    }

    @Transactional
    public ChatConversationResponse createGroup(
            String currentUserId,
            ChatGroupCreateRequest request
    ) {
        if (!userRoleRepository.existsByUserIdAndRole(
                currentUserId,
                AppRole.ADMIN
        )) {
            throw new AccessDeniedException(
                    "Only administrators can create chat groups"
            );
        }

        if (request == null || request.name == null ||
                request.name.isBlank()) {
            throw new IllegalArgumentException("Enter a group name");
        }

        validateActiveUser(currentUserId);

        ChatConversation conversation = new ChatConversation();
        conversation.setType(ChatConversationType.GROUP);
        conversation.setName(request.name.trim());
        conversation.setDescription(
                request.description == null
                        ? null
                        : request.description.trim()
        );
        conversation.setCreatedBy(currentUserId);

        conversation = conversationRepository.save(conversation);

        addMember(conversation.getId(), currentUserId, currentUserId, "OWNER");

        Set<String> memberIds = new LinkedHashSet<>();

        if (request.memberIds != null) {
            memberIds.addAll(request.memberIds);
        }

        memberIds.remove(currentUserId);

        if (memberIds.size() > 200) {
            throw new IllegalArgumentException(
                    "A group cannot contain more than 200 selected members"
            );
        }

        for (String memberId : memberIds) {
            if (memberId == null || memberId.isBlank()) {
                throw new IllegalArgumentException("Invalid group member");
            }

            validateActiveUser(memberId.trim());

            addMember(
                    conversation.getId(),
                    memberId.trim(),
                    currentUserId,
                    "MEMBER"
            );
        }

        return new ChatConversationResponse(conversation);
    }

    @Transactional(readOnly = true)
    public List<ChatConversationResponse> getMyConversations(
            String currentUserId
    ) {
        List<ChatConversationMember> memberships =
                memberRepository.findByUserIdAndActiveTrueOrderByJoinedAtDesc(
                        currentUserId
                );

        return memberships.stream()
                .map(member -> conversationRepository.findById(
                        member.getConversationId()
                ).orElse(null))
                .filter(conversation ->
                        conversation != null &&
                        conversation.getArchivedAt() == null
                )
                .map(conversation -> {
                    ChatConversationResponse response =
                            toConversationResponse(conversation, currentUserId);
                    messageRepository
                            .findFirstByConversationIdAndDeletedAtIsNullOrderByCreatedAtDesc(
                                    conversation.getId()
                            )
                            .ifPresent(message ->
                                    response.latestMessage =
                                            toMessageResponse(message)
                            );
                    ChatConversationMember member = memberships.stream()
                            .filter(item -> item.getConversationId()
                                    .equals(conversation.getId()))
                            .findFirst()
                            .orElseThrow();
                    response.unreadCount = member.getLastReadAt() == null
                            ? messageRepository
                                    .countByConversationIdAndDeletedAtIsNullAndSenderIdNot(
                                            conversation.getId(),
                                            currentUserId
                                    )
                            : messageRepository
                                    .countByConversationIdAndDeletedAtIsNullAndCreatedAtAfterAndSenderIdNot(
                                            conversation.getId(),
                                            member.getLastReadAt(),
                                            currentUserId
                                    );
                    return response;
                })
                .toList();
    }

    @Transactional(readOnly = true)
    public ChatConversationResponse getConversation(
            String conversationId,
            String currentUserId
    ) {
        requireConversationMember(conversationId, currentUserId);
        ChatConversation conversation = conversationRepository
                .findById(conversationId)
                .filter(item -> item.getArchivedAt() == null)
                .orElseThrow(() -> new IllegalArgumentException(
                        "Conversation not found"
                ));
        return toConversationResponse(conversation, currentUserId);
    }

    private ChatConversationResponse toConversationResponse(
            ChatConversation conversation,
            String currentUserId
    ) {
        ChatConversationResponse response =
                new ChatConversationResponse(conversation);
        if (conversation.getType() == ChatConversationType.PRIVATE) {
            memberRepository
                    .findByConversationIdAndActiveTrue(conversation.getId())
                    .stream()
                    .filter(member -> !member.getUserId().equals(currentUserId))
                    .findFirst()
                    .ifPresent(member -> {
                        response.otherUserId = member.getUserId();
                        response.displayName = profileRepository
                                .findById(member.getUserId())
                                .map(Profile::getFullName)
                                .orElse("TEAM BSY member");
                    });
        } else {
            response.displayName = conversation.getName();
        }
        return response;
    }

    @Transactional(readOnly = true)
    public List<ChatUserResponse> searchUsers(
            String currentUserId,
            String query
    ) {
        validateActiveUser(currentUserId);
        String normalized = query == null ? "" : query.trim();
        if (normalized.length() < 2) {
            throw new IllegalArgumentException(
                    "Enter at least two characters to search"
            );
        }
        return profileRepository
                .findByActiveTrueAndFullNameContainingIgnoreCaseOrderByFullName(
                        normalized,
                        PageRequest.of(0, 30)
                )
                .stream()
                .filter(profile -> !profile.getId().equals(currentUserId))
                .filter(profile -> appUserRepository.findById(profile.getId())
                        .filter(AppUser::isActive)
                        .isPresent())
                .map(profile -> new ChatUserResponse(
                        profile.getId(),
                        profile.getFullName()
                ))
                .toList();
    }

    public ChatUploadLimitsResponse getUploadLimits() {
        return new ChatUploadLimitsResponse(
                maxFileSizeBytes,
                maxFilesPerMessage
        );
    }

    @Transactional(readOnly = true)
    public void requireConversationMember(
            String conversationId,
            String currentUserId
    ) {
        boolean isMember =
                memberRepository.existsByConversationIdAndUserIdAndActiveTrue(
                        conversationId,
                        currentUserId
                );

        if (!isMember) {
            throw new AccessDeniedException(
                    "You are not a member of this conversation"
            );
        }
    }

    @Transactional(readOnly = true)
    public List<com.teambsy.backend.dto.ChatMessageResponse> getMessages(
            String conversationId,
            String currentUserId,
            int page,
            int size
    ) {
        requireConversationMember(conversationId, currentUserId);

        if (page < 0) {
            throw new IllegalArgumentException("Invalid page number");
        }

        if (size < 1 || size > 100) {
            throw new IllegalArgumentException(
                    "Page size must be between 1 and 100"
            );
        }

        org.springframework.data.domain.PageRequest pageable =
                org.springframework.data.domain.PageRequest.of(
                        page,
                        size
                );

        return messageRepository
                .findByConversationIdAndDeletedAtIsNullOrderByCreatedAtDesc(
                        conversationId,
                        pageable
                )
                .getContent()
                .stream()
                .sorted(java.util.Comparator.comparing(
                        com.teambsy.backend.entity.ChatMessage::getCreatedAt
                ))
                .map(this::toMessageResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public ChatMessageResponse getMessage(
            String conversationId,
            String messageId,
            String currentUserId
    ) {
        requireConversationMember(conversationId, currentUserId);
        ChatMessage message = messageRepository
                .findByIdAndConversationId(messageId, conversationId)
                .orElseThrow(() -> new IllegalArgumentException(
                        "Message not found"
                ));
        ChatMessageResponse response = toMessageResponse(message);
        if (message.getDeletedAt() != null) {
            response.content = "";
            response.attachments = List.of();
            response.reactions = List.of();
        }
        return response;
    }

    private void validateActiveUser(String userId) {

        AppUser user = appUserRepository.findById(userId)
                .filter(AppUser::isActive)
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "User is not registered or active"
                        )
                );

        Profile profile = profileRepository.findById(user.getId())
                .filter(Profile::isActive)
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "User profile is unavailable"
                        )
                );
    }

    private void addMember(
            String conversationId,
            String userId,
            String addedBy,
            String memberRole
    ) {
        ChatConversationMember member = new ChatConversationMember();
        member.setConversationId(conversationId);
        member.setUserId(userId);
        member.setAddedBy(addedBy);
        member.setMemberRole(memberRole);
        member.setActive(true);

        memberRepository.save(member);
    }

    @Transactional
    public com.teambsy.backend.dto.ChatMessageResponse sendMessage(
            String conversationId,
            String currentUserId,
            com.teambsy.backend.dto.ChatMessageRequest request
    ) {
        try {
            return sendMessageWithAttachments(
                    conversationId,
                    currentUserId,
                    request,
                    List.of()
            );
        } catch (IOException exception) {
            throw new IllegalStateException("Could not save chat attachments", exception);
        }
    }

    @Transactional
    public ChatMessageResponse sendMessageWithAttachments(
            String conversationId,
            String currentUserId,
            ChatMessageRequest request,
            List<MultipartFile> files
    ) throws IOException {
        validateActiveUser(currentUserId);
        requireConversationMember(conversationId, currentUserId);
        requireCanSendMessage(conversationId, currentUserId);

        List<MultipartFile> attachments =
                files == null ? List.of() : files;
        if (attachments.size() > maxFilesPerMessage) {
            throw new IllegalArgumentException(
                    "A message can contain at most " +
                            maxFilesPerMessage + " attachments"
            );
        }

        boolean hasAttachment = attachments.stream()
                .anyMatch(file -> file != null && !file.isEmpty());
        if (request != null && request.content != null &&
                request.content.length() > 10_000) {
            throw new IllegalArgumentException("Message is too long");
        }
        if (request != null && request.replyToId != null &&
                request.replyToId.length() > 36) {
            throw new IllegalArgumentException("Invalid reply message ID");
        }
        if ((request == null || request.content == null ||
                request.content.isBlank()) && !hasAttachment) {
            throw new IllegalArgumentException(
                    "Enter a message or attach a file"
            );
        }

        String replyToId = request == null ? null : request.replyToId;

        if (replyToId != null && !replyToId.isBlank()) {
            ChatMessage repliedMessage = messageRepository
                    .findByIdAndConversationId(replyToId, conversationId)
                    .orElseThrow(() -> new IllegalArgumentException(
                            "Reply message was not found in this conversation"
                    ));

            if (repliedMessage.getDeletedAt() != null) {
                throw new IllegalArgumentException(
                        "Cannot reply to a deleted message"
                );
            }
        } else {
            replyToId = null;
        }

        ChatMessage message = new ChatMessage();
        message.setConversationId(conversationId);
        message.setSenderId(currentUserId);
        message.setContent(request == null || request.content == null
                ? ""
                : request.content.trim());
        message.setReplyToId(replyToId);

        ChatMessage savedMessage = messageRepository.save(message);
        List<String> storedKeys = new ArrayList<>();
        try {
            for (MultipartFile file : attachments) {
                if (file == null || file.isEmpty()) {
                    continue;
                }
                ChatFileStorageService.StoredFile stored =
                        fileStorageService.save(
                                conversationId,
                                currentUserId,
                                file
                        );
                storedKeys.add(stored.storageKey());

                ChatMessageAttachment attachment =
                        new ChatMessageAttachment();
                attachment.setMessageId(savedMessage.getId());
                attachment.setStorageKey(stored.storageKey());
                attachment.setOriginalName(safeOriginalName(
                        file.getOriginalFilename()
                ));
                attachment.setMimeType(stored.mimeType());
                attachment.setSizeBytes(file.getSize());
                attachmentRepository.save(attachment);
            }
        } catch (IOException | RuntimeException exception) {
            for (String storageKey : storedKeys) {
                try {
                    fileStorageService.delete(storageKey);
                } catch (IOException cleanupException) {
                    exception.addSuppressed(cleanupException);
                }
            }
            throw exception;
        }
        if (!storedKeys.isEmpty() &&
                TransactionSynchronizationManager.isSynchronizationActive()) {
            List<String> storedKeysForRollback = List.copyOf(storedKeys);
            TransactionSynchronizationManager.registerSynchronization(
                    new TransactionSynchronization() {
                        @Override
                        public void afterCompletion(int status) {
                            if (status == STATUS_COMMITTED) {
                                return;
                            }
                            for (String storageKey : storedKeysForRollback) {
                                try {
                                    fileStorageService.delete(storageKey);
                                } catch (IOException cleanupException) {
                                    logger.warn(
                                            "Could not remove a chat file after rollback",
                                            cleanupException
                                    );
                                }
                            }
                        }
                    }
            );
        }

        List<ChatConversationMember> conversationMembers =
                memberRepository.findByConversationIdAndActiveTrue(
                        conversationId
                );

        List<ChatNotification> notifications = conversationMembers
                .stream()
                .filter(member -> !member.getUserId().equals(currentUserId))
                .map(member -> {
                    ChatNotification notification = new ChatNotification();
                    notification.setUserId(member.getUserId());
                    notification.setConversationId(conversationId);
                    notification.setMessageId(savedMessage.getId());
                    notification.setType("NEW_MESSAGE");
                    return notification;
                })
                .toList();

        if (!notifications.isEmpty()) {
            notificationRepository.saveAll(notifications);
        }

        ChatConversation conversation = conversationRepository
                .findById(conversationId)
                .orElseThrow(() -> new IllegalArgumentException(
                        "Conversation not found"
                ));

        conversationRepository.save(conversation);

        ChatMessageResponse response = toMessageResponse(savedMessage);
        ChatMessageResponse eventMessage = response;
        List<ChatNotification> savedNotifications = notifications;
        publishAfterCommit(() -> {
            ChatWebSocketEvent messageEvent = new ChatWebSocketEvent(
                    conversationId,
                    "MESSAGE",
                    eventMessage
            );
            for (ChatConversationMember member : conversationMembers) {
                messagingTemplate.convertAndSendToUser(
                        member.getUserId(),
                        "/queue/chat",
                        messageEvent
                );
            }
            for (ChatNotification notification : savedNotifications) {
                messagingTemplate.convertAndSendToUser(
                        notification.getUserId(),
                        "/queue/chat",
                        new ChatWebSocketEvent(
                                conversationId,
                                "NOTIFICATION",
                                new ChatNotificationResponse(notification)
                        )
                );
            }
        });
        return response;
    }

    private void publishAfterCommit(Runnable action) {
        if (!TransactionSynchronizationManager.isSynchronizationActive()) {
            action.run();
            return;
        }
        TransactionSynchronizationManager.registerSynchronization(
                new TransactionSynchronization() {
                    @Override
                    public void afterCommit() {
                        action.run();
                    }
                }
        );
    }

    private void publishToActiveMembersAfterCommit(
            String conversationId,
            ChatWebSocketEvent event
    ) {
        List<String> userIds = memberRepository
                .findByConversationIdAndActiveTrue(conversationId)
                .stream()
                .map(ChatConversationMember::getUserId)
                .toList();
        publishAfterCommit(() -> userIds.forEach(userId ->
                messagingTemplate.convertAndSendToUser(
                        userId,
                        "/queue/chat",
                        event
                )));
    }

    private ChatMessageResponse toMessageResponse(ChatMessage message) {
        String senderName = profileRepository.findById(message.getSenderId())
                .map(Profile::getFullName)
                .orElse("Unknown user");
        ChatMessageResponse response = new ChatMessageResponse(
                message,
                senderName
        );
        response.attachments = attachmentRepository
                .findByMessageId(message.getId())
                .stream()
                .map(ChatAttachmentResponse::new)
                .toList();
        response.reactions = reactionRepository
                .findByMessageIdIn(List.of(message.getId()))
                .stream()
                .map(reaction -> new ChatReactionResponse(
                        reaction,
                        profileRepository.findById(reaction.getUserId())
                                .map(Profile::getFullName)
                                .orElse("Unknown user")
                ))
                .toList();
        response.readReceipts = readRepository
                .findByMessageIdIn(List.of(message.getId()))
                .stream()
                .map(receipt -> new ChatReadReceiptResponse(
                        receipt.getMessageId(),
                        receipt.getUserId(),
                        profileRepository.findById(receipt.getUserId())
                                .map(Profile::getFullName)
                                .orElse("Unknown user"),
                        receipt.getReadAt()
                ))
                .toList();
        if (message.getReplyToId() != null) {
            messageRepository.findByIdAndConversationId(
                    message.getReplyToId(),
                    message.getConversationId()
            ).ifPresent(parent -> {
                String parentSenderName = profileRepository
                        .findById(parent.getSenderId())
                        .map(Profile::getFullName)
                        .orElse("Unknown user");
                response.replyPreview = new ChatReplyPreviewResponse(
                        parent.getId(),
                        parent.getSenderId(),
                        parentSenderName,
                        parent.getDeletedAt() == null
                                ? parent.getContent()
                                : "",
                        parent.getDeletedAt() != null
                );
            });
        }
        return response;
    }

    private String safeOriginalName(String originalName) {
        if (originalName == null || originalName.isBlank()) {
            return "attachment";
        }
        String normalized = originalName.replace('\\', '/');
        String baseName = normalized.substring(normalized.lastIndexOf('/') + 1);
        String safeName = baseName.replaceAll("[\\p{Cntrl}]", "_").trim();
        if (safeName.isEmpty()) {
            return "attachment";
        }
        return safeName.length() <= 255
                ? safeName
                : safeName.substring(safeName.length() - 255);
    }

    @Transactional(readOnly = true)
    public List<ChatMemberResponse> getConversationMembers(
            String conversationId,
            String currentUserId
    ) {
        requireConversationMember(conversationId, currentUserId);

        return memberRepository
                .findByConversationIdAndActiveTrue(conversationId)
                .stream()
                .sorted(java.util.Comparator.comparing(
                        ChatConversationMember::getJoinedAt
                ))
                .map(member -> {
                    Profile profile = profileRepository
                            .findById(member.getUserId())
                            .orElse(null);

                    String fullName = profile == null
                            ? "Unknown user"
                            : profile.getFullName();

                    String mobile = profile == null
                            ? null
                            : profile.getMobile();

                    ChatMemberResponse response = new ChatMemberResponse(
                            member.getUserId(),
                            fullName,
                            mobile,
                            member.getMemberRole(),
                            member.getJoinedAt(),
                            presenceService.isOnline(member.getUserId())
                    );
                    response.setPresence(
                            presenceService.isOnline(member.getUserId()),
                            presenceService.getLastSeen(member.getUserId())
                    );
                    return response;
                })
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ChatMemberResponse> getActiveMembersForBroadcast(
            String conversationId
    ) {
        return memberRepository.findByConversationIdAndActiveTrue(conversationId)
                .stream()
                .map(member -> {
                    Profile profile = profileRepository
                            .findById(member.getUserId())
                            .orElse(null);
                    ChatMemberResponse response = new ChatMemberResponse(
                            member.getUserId(),
                            profile == null ? "Unknown user" : profile.getFullName(),
                            profile == null ? null : profile.getMobile(),
                            member.getMemberRole(),
                            member.getJoinedAt(),
                            presenceService.isOnline(member.getUserId())
                    );
                    response.setPresence(
                            presenceService.isOnline(member.getUserId()),
                            presenceService.getLastSeen(member.getUserId())
                    );
                    return response;
                })
                .toList();
    }

    @Transactional
    public ChatConversationResponse updateGroup(
            String conversationId,
            String currentUserId,
            ChatGroupUpdateRequest request
    ) {
        ChatConversation conversation = requireGroup(conversationId);
        requireGroupManager(conversation, currentUserId);

        if (request == null || request.name == null ||
                request.name.isBlank()) {
            throw new IllegalArgumentException("Enter a group name");
        }

        conversation.setName(request.name.trim());
        conversation.setDescription(
                request.description == null
                        ? null
                        : request.description.trim()
        );
        if (request.onlyAdminsCanSend != null) {
            conversation.setOnlyAdminsCanSend(request.onlyAdminsCanSend);
        }

        return new ChatConversationResponse(
                conversationRepository.save(conversation)
        );
    }

    @Transactional
    public void addGroupMember(
            String conversationId,
            String currentUserId,
            ChatGroupMemberRequest request
    ) {
        ChatConversation conversation = requireGroup(conversationId);
        requireGroupManager(conversation, currentUserId);

        if (request == null || request.userId == null ||
                request.userId.isBlank()) {
            throw new IllegalArgumentException("Select a user");
        }

        String targetUserId = request.userId.trim();
        validateActiveUser(targetUserId);

        var existing = memberRepository
                .findByConversationIdAndUserId(
                        conversationId,
                        targetUserId
                );

        if (existing.isPresent()) {
            ChatConversationMember member = existing.get();

            if (member.isActive()) {
                throw new IllegalArgumentException(
                        "User is already a group member"
                );
            }

            member.setActive(true);
            member.setAddedBy(currentUserId);
            member.setMemberRole("MEMBER");
            memberRepository.save(member);
            return;
        }

        addMember(conversationId, targetUserId, currentUserId, "MEMBER");
    }

    @Transactional
    public void removeGroupMember(
            String conversationId,
            String currentUserId,
            String targetUserId
    ) {
        ChatConversation conversation = requireGroup(conversationId);
        requireGroupManager(conversation, currentUserId);

        ChatConversationMember member = memberRepository
                .findByConversationIdAndUserId(
                        conversationId,
                        targetUserId
                )
                .filter(ChatConversationMember::isActive)
                .orElseThrow(() -> new IllegalArgumentException(
                        "Active group member not found"
                ));

        if (member.getUserId().equals(conversation.getCreatedBy())) {
            throw new IllegalArgumentException(
                    "The group creator cannot be removed"
            );
        }

        member.setActive(false);
        memberRepository.save(member);
    }

    @Transactional
    public void updateGroupMemberRole(
            String conversationId,
            String currentUserId,
            String targetUserId,
            String role
    ) {
        ChatConversation conversation = requireGroup(conversationId);
        requireGroupOwner(conversation, currentUserId);
        ChatConversationMember member = memberRepository
                .findByConversationIdAndUserId(conversationId, targetUserId)
                .filter(ChatConversationMember::isActive)
                .orElseThrow(() -> new IllegalArgumentException(
                        "Active group member not found"
                ));
        if (member.getUserId().equals(conversation.getCreatedBy())) {
            throw new IllegalArgumentException(
                    "The group owner role cannot be changed"
            );
        }
        if (!"ADMIN".equals(role) && !"MEMBER".equals(role)) {
            throw new IllegalArgumentException("Role must be ADMIN or MEMBER");
        }
        member.setMemberRole(role);
        memberRepository.save(member);
    }

    private void requireAdmin(String userId) {
        if (!userRoleRepository.existsByUserIdAndRole(
                userId,
                AppRole.ADMIN
        )) {
            throw new AccessDeniedException("Only administrators can create groups");
        }
    }

    private void requireGroupManager(
            ChatConversation conversation,
            String userId
    ) {
        if (userRoleRepository.existsByUserIdAndRole(userId, AppRole.ADMIN)) {
            return;
        }

        ChatConversationMember member = memberRepository
                .findByConversationIdAndUserId(
                        conversation.getId(),
                        userId
                )
                .filter(ChatConversationMember::isActive)
                .orElseThrow(() -> new AccessDeniedException(
                        "Only group administrators can manage this group"
                ));
        if (!"OWNER".equals(member.getMemberRole()) &&
                !"ADMIN".equals(member.getMemberRole())) {
            throw new AccessDeniedException(
                    "Only group administrators can manage this group"
            );
        }
    }

    private void requireGroupOwner(
            ChatConversation conversation,
            String userId
    ) {
        if (userRoleRepository.existsByUserIdAndRole(userId, AppRole.ADMIN)) {
            return;
        }
        ChatConversationMember member = memberRepository
                .findByConversationIdAndUserId(conversation.getId(), userId)
                .filter(ChatConversationMember::isActive)
                .orElseThrow(() -> new AccessDeniedException(
                        "Only the group owner can change administrator roles"
                ));
        if (!"OWNER".equals(member.getMemberRole())) {
            throw new AccessDeniedException(
                    "Only the group owner can change administrator roles"
            );
        }
    }

    private boolean isGroupAdministrator(String conversationId, String userId) {
        if (userRoleRepository.existsByUserIdAndRole(userId, AppRole.ADMIN)) {
            return true;
        }
        return memberRepository
                .findByConversationIdAndUserId(conversationId, userId)
                .filter(ChatConversationMember::isActive)
                .map(member -> "OWNER".equals(member.getMemberRole()) ||
                        "ADMIN".equals(member.getMemberRole()))
                .orElse(false);
    }

    private void requireCanSendMessage(
            String conversationId,
            String userId
    ) {
        ChatConversation conversation = conversationRepository
                .findById(conversationId)
                .orElseThrow(() -> new IllegalArgumentException(
                        "Conversation not found"
                ));
        if (conversation.getType() != ChatConversationType.GROUP ||
                !conversation.isOnlyAdminsCanSend() ||
                userRoleRepository.existsByUserIdAndRole(userId, AppRole.ADMIN)) {
            return;
        }

        if (!isGroupAdministrator(conversationId, userId)) {
            throw new AccessDeniedException(
                    "Only group administrators can send messages"
            );
        }
    }

    private ChatConversation requireGroup(String conversationId) {
        ChatConversation conversation = conversationRepository
                .findById(conversationId)
                .orElseThrow(() -> new IllegalArgumentException(
                        "Conversation not found"
                ));

        if (conversation.getType() != ChatConversationType.GROUP) {
            throw new IllegalArgumentException(
                    "This operation is only available for group conversations"
            );
        }

        if (conversation.getArchivedAt() != null) {
            throw new IllegalArgumentException(
                    "This group is archived"
            );
        }

        return conversation;
    }

    @Transactional(readOnly = true)
    public List<ChatMessageResponse> searchMessages(
            String conversationId,
            String currentUserId,
            String searchText,
            int page,
            int size
    ) {
        requireConversationMember(conversationId, currentUserId);

        if (searchText == null || searchText.isBlank()) {
            throw new IllegalArgumentException(
                    "Enter text to search"
            );
        }

        if (page < 0 || size < 1 || size > 100) {
            throw new IllegalArgumentException(
                    "Invalid pagination values"
            );
        }

        return messageRepository
                .findByConversationIdAndDeletedAtIsNullAndContentContainingIgnoreCaseOrderByCreatedAtDesc(
                        conversationId,
                        searchText.trim(),
                        PageRequest.of(page, size)
                )
                .getContent()
                .stream()
                .sorted(Comparator.comparing(ChatMessage::getCreatedAt))
                .map(this::toMessageResponse)
                .toList();
    }

    @Transactional
    public ChatMessageResponse editMessage(
            String conversationId,
            String messageId,
            String currentUserId,
            ChatMessageRequest request
    ) {
        requireConversationMember(conversationId, currentUserId);
        ChatMessage message = messageRepository
                .findByIdAndConversationId(messageId, conversationId)
                .filter(item -> item.getDeletedAt() == null)
                .orElseThrow(() -> new IllegalArgumentException(
                        "Message not found"
                ));
        if (!message.getSenderId().equals(currentUserId)) {
            throw new AccessDeniedException(
                    "You can only edit your own messages"
            );
        }
        if (request == null || request.content == null ||
                request.content.isBlank()) {
            throw new IllegalArgumentException(
                    "Message content cannot be empty"
            );
        }
        message.setContent(request.content.trim());
        message.setEditedAt(LocalDateTime.now());
        ChatMessageResponse response =
                toMessageResponse(messageRepository.save(message));
        publishToActiveMembersAfterCommit(
                conversationId,
                new ChatWebSocketEvent(
                        conversationId,
                        "MESSAGE_UPDATED",
                        response
                )
        );
        return response;
    }

    @Transactional
    public void deleteMessage(
            String conversationId,
            String messageId,
            String currentUserId
    ) {
        requireConversationMember(conversationId, currentUserId);
        ChatMessage message = messageRepository
                .findByIdAndConversationId(messageId, conversationId)
                .filter(item -> item.getDeletedAt() == null)
                .orElseThrow(() -> new IllegalArgumentException(
                        "Message not found"
                ));
        boolean ownsMessage = message.getSenderId().equals(currentUserId);
        ChatConversation conversation = conversationRepository
                .findById(conversationId)
                .orElseThrow(() -> new IllegalArgumentException(
                        "Conversation not found"
                ));
        boolean isSystemAdmin = userRoleRepository.existsByUserIdAndRole(
                currentUserId,
                AppRole.ADMIN
        );
        if (!ownsMessage && !isSystemAdmin &&
                !(conversation.getType() == ChatConversationType.GROUP &&
                        isGroupAdministrator(conversationId, currentUserId))) {
            throw new AccessDeniedException(
                    "You are not allowed to delete this message"
            );
        }
        message.setDeletedAt(LocalDateTime.now());
        messageRepository.save(message);
        publishToActiveMembersAfterCommit(
                conversationId,
                new ChatWebSocketEvent(
                        conversationId,
                        "MESSAGE_DELETED",
                        messageId
                )
        );
    }

    @Transactional(readOnly = true)
    public ChatMessageAttachment getAttachment(
            String attachmentId,
            String currentUserId
    ) {
        ChatMessageAttachment attachment = attachmentRepository
                .findById(attachmentId)
                .orElseThrow(() -> new IllegalArgumentException(
                        "Attachment not found"
                ));
        ChatMessage message = messageRepository.findById(attachment.getMessageId())
                .orElseThrow(() -> new IllegalArgumentException(
                        "Attachment not found"
                ));
        requireConversationMember(message.getConversationId(), currentUserId);
        if (message.getDeletedAt() != null) {
            throw new IllegalArgumentException("Attachment not found");
        }
        return attachment;
    }

    @Transactional(readOnly = true)
    public List<ChatReactionResponse> getReactions(
            String conversationId,
            String messageId,
            String currentUserId
    ) {
        requireConversationMember(conversationId, currentUserId);
        ChatMessage message = messageRepository
                .findByIdAndConversationId(messageId, conversationId)
                .filter(item -> item.getDeletedAt() == null)
                .orElseThrow(() -> new IllegalArgumentException(
                        "Message not found"
                ));
        return reactionRepository.findByMessageIdIn(List.of(message.getId()))
                .stream()
                .map(reaction -> new ChatReactionResponse(
                        reaction,
                        profileRepository.findById(reaction.getUserId())
                                .map(Profile::getFullName)
                                .orElse("Unknown user")
                ))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ChatReadReceiptResponse> getReadReceipts(
            String conversationId,
            String messageId,
            String currentUserId
    ) {
        requireConversationMember(conversationId, currentUserId);
        ChatMessage message = messageRepository
                .findByIdAndConversationId(messageId, conversationId)
                .orElseThrow(() -> new IllegalArgumentException(
                        "Message not found"
                ));
        return readRepository.findByMessageIdIn(List.of(message.getId()))
                .stream()
                .map(receipt -> new ChatReadReceiptResponse(
                        receipt.getMessageId(),
                        receipt.getUserId(),
                        profileRepository.findById(receipt.getUserId())
                                .map(Profile::getFullName)
                                .orElse("Unknown user"),
                        receipt.getReadAt()
                ))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ChatNotificationResponse> getNotifications(
            String currentUserId,
            int page,
            int size
    ) {
        validatePage(page, size);
        return notificationRepository
                .findByUserIdOrderByCreatedAtDesc(
                        currentUserId,
                        PageRequest.of(page, size)
                )
                .getContent()
                .stream()
                .filter(notification ->
                        memberRepository.existsByConversationIdAndUserIdAndActiveTrue(
                                notification.getConversationId(),
                                currentUserId
                        ))
                .map(ChatNotificationResponse::new)
                .toList();
    }

    @Transactional(readOnly = true)
    public long getUnreadNotificationCount(String currentUserId) {
        return notificationRepository
                .findByUserIdAndReadAtIsNull(currentUserId)
                .stream()
                .filter(notification ->
                        memberRepository.existsByConversationIdAndUserIdAndActiveTrue(
                                notification.getConversationId(),
                                currentUserId
                        ))
                .count();
    }

    @Transactional
    public void markNotificationRead(
            String notificationId,
            String currentUserId
    ) {
        ChatNotification notification = notificationRepository
                .findByIdAndUserId(notificationId, currentUserId)
                .filter(item ->
                        memberRepository.existsByConversationIdAndUserIdAndActiveTrue(
                                item.getConversationId(),
                                currentUserId
                        ))
                .orElseThrow(() -> new IllegalArgumentException(
                        "Notification not found"
                ));
        if (notification.getReadAt() == null) {
            notification.setReadAt(LocalDateTime.now());
            notificationRepository.save(notification);
        }
    }

    @Transactional
    public void markAllNotificationsRead(String currentUserId) {
        LocalDateTime readAt = LocalDateTime.now();
        List<ChatNotification> notifications =
                notificationRepository.findByUserIdAndReadAtIsNull(currentUserId);
        for (ChatNotification notification : notifications) {
            if (memberRepository.existsByConversationIdAndUserIdAndActiveTrue(
                    notification.getConversationId(),
                    currentUserId
            )) {
                notification.setReadAt(readAt);
            }
        }
        notificationRepository.saveAll(notifications);
    }

    private void validatePage(int page, int size) {
        if (page < 0 || size < 1 || size > 100) {
            throw new IllegalArgumentException("Invalid pagination values");
        }
    }

    @Transactional
    public boolean toggleReaction(
            String conversationId,
            String messageId,
            String currentUserId,
            String emoji
    ) {
        requireConversationMember(conversationId, currentUserId);

        if (emoji == null || emoji.isBlank() || emoji.length() > 32) {
            throw new IllegalArgumentException("Invalid emoji");
        }

        ChatMessage message = messageRepository
                .findByIdAndConversationId(messageId, conversationId)
                .filter(m -> m.getDeletedAt() == null)
                .orElseThrow(() -> new IllegalArgumentException(
                        "Message not found"
                ));

        var existing = reactionRepository
                .findByMessageIdAndUserIdAndEmoji(
                        message.getId(),
                        currentUserId,
                        emoji
                );

        if (existing.isPresent()) {
            reactionRepository.delete(existing.get());
            publishReactionUpdate(conversationId, messageId, currentUserId);
            return false;
        }

        var reaction = new com.teambsy.backend.entity.ChatMessageReaction();
        reaction.setMessageId(message.getId());
        reaction.setUserId(currentUserId);
        reaction.setEmoji(emoji);

        reactionRepository.save(reaction);
        publishReactionUpdate(conversationId, messageId, currentUserId);
        return true;
    }

    private void publishReactionUpdate(
            String conversationId,
            String messageId,
            String currentUserId
    ) {
        List<ChatReactionResponse> reactions = getReactions(
                conversationId,
                messageId,
                currentUserId
        );
        ChatWebSocketEvent event = new ChatWebSocketEvent(
                conversationId,
                "REACTIONS",
                new ChatReactionUpdate(messageId, reactions)
        );
        publishToActiveMembersAfterCommit(conversationId, event);
    }

    @Transactional
    public List<ChatReadReceiptResponse> markMessagesRead(
            String conversationId,
            String currentUserId,
            ChatReadRequest request
    ) {
        requireConversationMember(conversationId, currentUserId);

        if (request == null || request.messageIds == null ||
                request.messageIds.isEmpty() ||
                request.messageIds.size() > 100) {
            throw new IllegalArgumentException("Select valid messages");
        }

        LocalDateTime readTime = LocalDateTime.now();
        Set<String> uniqueMessageIds = new HashSet<>(request.messageIds);
        List<ChatReadReceiptResponse> responses = new ArrayList<>();

        for (String messageId : uniqueMessageIds) {
            if (messageId == null || messageId.isBlank()) {
                throw new IllegalArgumentException("Invalid message ID");
            }

            ChatMessage message = messageRepository
                    .findByIdAndConversationId(messageId, conversationId)
                    .filter(m -> m.getDeletedAt() == null)
                    .orElseThrow(() -> new IllegalArgumentException(
                            "Message not found in this conversation"
                    ));

            var existing = readRepository
                    .findByMessageIdAndUserId(message.getId(), currentUserId);

            if (existing.isEmpty()) {
                ChatMessageRead receipt = new ChatMessageRead();
                receipt.setMessageId(message.getId());
                receipt.setUserId(currentUserId);
                readRepository.save(receipt);

                String userName = profileRepository
                        .findById(currentUserId)
                        .map(Profile::getFullName)
                        .orElse("Unknown user");

                responses.add(new ChatReadReceiptResponse(
                        message.getId(),
                        currentUserId,
                        userName,
                        readTime
                ));
            }
        }

        ChatConversationMember member = memberRepository
                .findByConversationIdAndUserId(conversationId, currentUserId)
                .filter(ChatConversationMember::isActive)
                .orElseThrow(() -> new IllegalArgumentException(
                        "Conversation membership not found"
                ));

        member.setLastReadAt(readTime);
        memberRepository.save(member);

        if (!responses.isEmpty()) {
            publishToActiveMembersAfterCommit(
                    conversationId,
                    new ChatWebSocketEvent(
                            conversationId,
                            "READ_RECEIPTS",
                            responses
                    )
            );
        }
        return responses;
    }}