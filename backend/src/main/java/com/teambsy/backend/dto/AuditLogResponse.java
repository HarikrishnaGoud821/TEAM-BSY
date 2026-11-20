package com.teambsy.backend.dto;

import com.teambsy.backend.entity.AuditLog;
import java.time.LocalDateTime;
import java.util.Map;

public class AuditLogResponse {

    public String id;
    public String user_id;
    public String who;
    public String action;
    public String entity;
    public String entity_id;
    public Map<String, String> details;
    public LocalDateTime created_at;

    public AuditLogResponse(AuditLog log, String who) {
        this.id = log.getId();
        this.user_id = log.getUserId();
        this.who = who;
        this.action = log.getAction();
        this.entity = log.getEntity();
        this.entity_id = log.getEntityId();
        this.details = log.getDetails() == null || log.getDetails().isBlank()
                ? Map.of()
                : Map.of("details", log.getDetails());
        this.created_at = log.getCreatedAt();
    }
}
