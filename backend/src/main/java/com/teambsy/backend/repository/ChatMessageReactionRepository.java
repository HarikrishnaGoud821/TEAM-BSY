package com.teambsy.backend.repository;

import com.teambsy.backend.entity.ChatMessageReaction;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface ChatMessageReactionRepository
        extends JpaRepository<ChatMessageReaction, String> {

    List<ChatMessageReaction> findByMessageIdIn(
            Collection<String> messageIds
    );

    Optional<ChatMessageReaction> findByMessageIdAndUserIdAndEmoji(
            String messageId,
            String userId,
            String emoji
    );
}