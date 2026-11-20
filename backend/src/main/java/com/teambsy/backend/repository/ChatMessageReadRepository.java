package com.teambsy.backend.repository;

import com.teambsy.backend.entity.ChatMessageRead;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface ChatMessageReadRepository
        extends JpaRepository<ChatMessageRead, String> {

    List<ChatMessageRead> findByMessageIdIn(
            Collection<String> messageIds
    );

    Optional<ChatMessageRead> findByMessageIdAndUserId(
            String messageId,
            String userId
    );
}