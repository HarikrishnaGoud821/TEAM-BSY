package com.teambsy.backend.repository;

import com.teambsy.backend.entity.ChatMessageAttachment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;

public interface ChatMessageAttachmentRepository
        extends JpaRepository<ChatMessageAttachment, String> {

    List<ChatMessageAttachment> findByMessageId(String messageId);

    List<ChatMessageAttachment> findByMessageIdIn(
            Collection<String> messageIds
    );
}