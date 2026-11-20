package com.teambsy.backend.config;

import com.teambsy.backend.entity.AppUser;
import com.teambsy.backend.repository.AppUserRepository;
import com.teambsy.backend.repository.UserRoleRepository;
import com.teambsy.backend.repository.ChatConversationMemberRepository;
import com.teambsy.backend.service.JwtService;

import io.jsonwebtoken.JwtException;

import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.MessagingException;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.stereotype.Component;

@Component
public class JwtStompChannelInterceptor implements ChannelInterceptor {

    private final JwtService jwtService;
    private final AppUserRepository appUserRepository;
    private final UserRoleRepository userRoleRepository;
    private final ChatConversationMemberRepository memberRepository;

    private static final Pattern SUBSCRIBE_PATTERN =
            Pattern.compile("^/topic/conversations/([0-9a-fA-F-]{36})$");

    private static final Pattern SEND_PATTERN =
            Pattern.compile(
                    "^/app/chat/([0-9a-fA-F-]{36})/" +
                            "(send|read|messages/[0-9a-fA-F-]{36}/react)$"
            );

    public JwtStompChannelInterceptor(
            JwtService jwtService,
            AppUserRepository appUserRepository,
            UserRoleRepository userRoleRepository,
            ChatConversationMemberRepository memberRepository
    ) {
        this.jwtService = jwtService;
        this.appUserRepository = appUserRepository;
        this.userRoleRepository = userRoleRepository;
        this.memberRepository = memberRepository;
    }

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {

        StompHeaderAccessor accessor =
                MessageHeaderAccessor.getAccessor(
                        message,
                        StompHeaderAccessor.class
                );

        if (accessor == null) {
            throw new MessagingException("Invalid WebSocket message");
        }

        StompCommand command = accessor.getCommand();

        if (command == StompCommand.CONNECT) {
            authenticateConnection(accessor);
            return message;
        }

        if (command == StompCommand.SUBSCRIBE) {
            authorizeSubscription(accessor);
        }

        if (command == StompCommand.SEND) {
            authorizeMessageSend(accessor);
        }

        return message;
    }

    private void authenticateConnection(StompHeaderAccessor accessor) {

        String authorization =
                accessor.getFirstNativeHeader("Authorization");

        if (authorization == null || !authorization.startsWith("Bearer ")) {
            throw new MessagingException(
                    "Missing WebSocket authentication token"
            );
        }

        String token = authorization.substring(7);

        try {
            String userId = jwtService.extractUserId(token);

            AppUser user = appUserRepository.findById(userId)
                    .filter(AppUser::isActive)
                    .orElseThrow(() ->
                            new MessagingException(
                                    "User account is inactive or unavailable"
                            )
                    );

            var authorities = userRoleRepository.findByUserId(userId)
                    .stream()
                    .map(role -> new SimpleGrantedAuthority(
                            "ROLE_" + role.getRole().name()
                    ))
                    .toList();

            var authentication =
                    new UsernamePasswordAuthenticationToken(
                            user.getId(),
                            null,
                            authorities
                    );

            accessor.setUser(authentication);

        } catch (JwtException | IllegalArgumentException exception) {
            throw new MessagingException(
                    "Invalid or expired WebSocket token"
            );
        }
    }

    private void authorizeSubscription(StompHeaderAccessor accessor) {

        String destination = accessor.getDestination();

        if ("/user/queue/chat".equals(destination)) {
            requireAuthenticatedUser(accessor);
            return;
        }

        if ("/topic/presence".equals(destination)) {
            requireAuthenticatedUser(accessor);
            return;
        }

        Matcher matcher = destination == null
                ? null
                : SUBSCRIBE_PATTERN.matcher(destination);

        if (matcher == null || !matcher.matches()) {
            throw new MessagingException(
                    "Subscription destination is not allowed"
            );
        }

        String conversationId = validateConversationId(matcher.group(1));
        String userId = requireAuthenticatedUser(accessor);

        requireConversationMembership(conversationId, userId);
    }

    private void authorizeMessageSend(StompHeaderAccessor accessor) {

        String destination = accessor.getDestination();

        Matcher matcher = destination == null
                ? null
                : SEND_PATTERN.matcher(destination);

        if (matcher == null || !matcher.matches()) {
            throw new MessagingException(
                    "Message destination is not allowed"
            );
        }

        String conversationId = validateConversationId(matcher.group(1));
        String userId = requireAuthenticatedUser(accessor);

        requireConversationMembership(conversationId, userId);
    }

    private String requireAuthenticatedUser(StompHeaderAccessor accessor) {

        if (accessor.getUser() == null ||
                accessor.getUser().getName() == null) {
            throw new MessagingException(
                    "WebSocket authentication is required"
            );
        }

        return accessor.getUser().getName();
    }

    private String validateConversationId(String conversationId) {

        try {
            return UUID.fromString(conversationId).toString();
        } catch (IllegalArgumentException exception) {
            throw new MessagingException(
                    "Invalid conversation ID"
            );
        }
    }

    private void requireConversationMembership(
            String conversationId,
            String userId
    ) {
        boolean isMember =
                memberRepository.existsByConversationIdAndUserIdAndActiveTrue(
                        conversationId,
                        userId
                );

        if (!isMember) {
            throw new MessagingException(
                    "You are not an active member of this conversation"
            );
        }
    }
}