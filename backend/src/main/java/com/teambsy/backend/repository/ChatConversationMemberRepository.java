package com.teambsy.backend.repository;

import com.teambsy.backend.entity.ChatConversationMember;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ChatConversationMemberRepository
        extends JpaRepository<ChatConversationMember, String> {

    List<ChatConversationMember> findByConversationIdAndActiveTrue(
            String conversationId
    );

    List<ChatConversationMember> findByUserIdAndActiveTrueOrderByJoinedAtDesc(
            String userId
    );

    Optional<ChatConversationMember> findByConversationIdAndUserId(
            String conversationId,
            String userId
    );

    boolean existsByConversationIdAndUserIdAndActiveTrue(
            String conversationId,
            String userId
    );
}