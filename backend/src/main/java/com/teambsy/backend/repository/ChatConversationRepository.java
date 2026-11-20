package com.teambsy.backend.repository;

import com.teambsy.backend.entity.ChatConversation;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ChatConversationRepository
        extends JpaRepository<ChatConversation, String> {

    Optional<ChatConversation> findByPrivateKey(String privateKey);
}