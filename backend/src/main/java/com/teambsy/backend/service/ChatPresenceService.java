package com.teambsy.backend.service;

import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.socket.messaging.SessionConnectedEvent;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;

import java.security.Principal;
import java.time.LocalDateTime;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;

@Service
public class ChatPresenceService {

    private final SimpMessagingTemplate messagingTemplate;
    private final ConcurrentMap<String, Set<String>> sessions =
            new ConcurrentHashMap<>();
    private final ConcurrentMap<String, LocalDateTime> lastSeen =
            new ConcurrentHashMap<>();

    public ChatPresenceService(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    @EventListener
    public void onConnected(SessionConnectedEvent event) {
        StompHeaderAccessor accessor =
                StompHeaderAccessor.wrap(event.getMessage());
        Principal principal = accessor.getUser();
        String sessionId = accessor.getSessionId();
        if (principal == null || principal.getName() == null ||
                sessionId == null) {
            return;
        }

        String userId = principal.getName();
        Set<String> userSessions = sessions.computeIfAbsent(
                userId,
                ignored -> ConcurrentHashMap.newKeySet()
        );
        if (userSessions.add(sessionId) && userSessions.size() == 1) {
            lastSeen.remove(userId);
            broadcast(userId, true, null);
        }
    }

    @EventListener
    public void onDisconnected(SessionDisconnectEvent event) {
        StompHeaderAccessor accessor =
                StompHeaderAccessor.wrap(event.getMessage());
        Principal principal = accessor.getUser();
        String sessionId = event.getSessionId();
        if (principal == null || principal.getName() == null ||
                sessionId == null) {
            return;
        }

        String userId = principal.getName();
        Set<String> userSessions = sessions.get(userId);
        if (userSessions == null || !userSessions.remove(sessionId) ||
                !userSessions.isEmpty()) {
            return;
        }

        sessions.remove(userId, userSessions);
        LocalDateTime disconnectedAt = LocalDateTime.now();
        lastSeen.put(userId, disconnectedAt);
        broadcast(userId, false, disconnectedAt);
    }

    public boolean isOnline(String userId) {
        Set<String> userSessions = sessions.get(userId);
        return userSessions != null && !userSessions.isEmpty();
    }

    public LocalDateTime getLastSeen(String userId) {
        return lastSeen.get(userId);
    }

    private void broadcast(
            String userId,
            boolean online,
            LocalDateTime lastSeenAt
    ) {
        messagingTemplate.convertAndSend(
                "/topic/presence",
                new PresenceUpdate(userId, online, lastSeenAt)
        );
    }

    public record PresenceUpdate(
            String userId,
            boolean online,
            LocalDateTime lastSeenAt
    ) {
    }
}
