package com.teambsy.backend.repository;

import com.teambsy.backend.entity.ChatMessage;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ChatMessageRepository
        extends JpaRepository<ChatMessage, String> {

    Page<ChatMessage> findByConversationIdAndDeletedAtIsNullOrderByCreatedAtDesc(
            String conversationId,
            Pageable pageable
    );

    Optional<ChatMessage> findByIdAndConversationId(
            String id,
            String conversationId
    );

    Page<ChatMessage> findByConversationIdAndDeletedAtIsNullAndContentContainingIgnoreCaseOrderByCreatedAtDesc(
            String conversationId,
            String content,
            Pageable pageable
    );

    Optional<ChatMessage> findFirstByConversationIdAndDeletedAtIsNullOrderByCreatedAtDesc(
            String conversationId
    );

    long countByConversationIdAndDeletedAtIsNullAndSenderIdNot(
            String conversationId,
            String senderId
    );

    long countByConversationIdAndDeletedAtIsNullAndCreatedAtAfterAndSenderIdNot(
            String conversationId,
            java.time.LocalDateTime createdAt,
            String senderId
    );
}