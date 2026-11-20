package com.teambsy.backend.repository;

import com.teambsy.backend.entity.ChatNotification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.List;

public interface ChatNotificationRepository
        extends JpaRepository<ChatNotification, String> {

    Page<ChatNotification> findByUserIdOrderByCreatedAtDesc(
            String userId,
            Pageable pageable
    );

    long countByUserIdAndReadAtIsNull(String userId);

    Page<ChatNotification> findByUserIdAndReadAtIsNullOrderByCreatedAtDesc(
            String userId,
            Pageable pageable
    );

    Optional<ChatNotification> findByIdAndUserId(String id, String userId);

    List<ChatNotification> findByUserIdAndReadAtIsNull(String userId);

    List<ChatNotification> findByConversationIdAndMessageId(
            String conversationId,
            String messageId
    );
}