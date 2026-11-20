package com.teambsy.backend.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Locale;
import java.util.UUID;

@Service
public class ChatFileStorageService {

    private final Path storageDirectory;
    private final long maxFileSize;

    public ChatFileStorageService(
            @Value("${team-bsy.chat.upload-dir:uploads/chat}") String uploadDir,
            @Value("${team-bsy.chat.max-file-size:20971520}") long maxFileSize
    ) {
        this.storageDirectory = Path.of(uploadDir)
                .toAbsolutePath()
                .normalize();
        this.maxFileSize = maxFileSize;
    }

    public StoredFile save(
            String conversationId,
            String userId,
            MultipartFile file
    ) throws IOException {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Choose a non-empty attachment");
        }
        if (file.getSize() > maxFileSize) {
            throw new IllegalArgumentException("Attachment exceeds the size limit");
        }

        FileType type = detectType(file);
        String safeConversationId = requireUuid(conversationId);
        String safeUserId = requireUuid(userId);
        String storageKey = safeConversationId + "/" + safeUserId + "/" +
                UUID.randomUUID() + "." + type.extension();
        Path target = resolve(storageKey);

        Files.createDirectories(target.getParent());
        try (InputStream input = file.getInputStream()) {
            Files.copy(input, target);
        } catch (IOException exception) {
            try {
                Files.deleteIfExists(target);
            } catch (IOException cleanupException) {
                exception.addSuppressed(cleanupException);
            }
            throw exception;
        }

        return new StoredFile(storageKey, type.mimeType());
    }

    public Resource load(String storageKey) throws IOException {
        Path file = resolve(storageKey);
        if (!Files.exists(file) || !Files.isRegularFile(file) ||
                !Files.isReadable(file)) {
            throw new IllegalArgumentException("Attachment not found");
        }

        Resource resource = new UrlResource(file.toUri());
        if (!resource.exists() || !resource.isReadable()) {
            throw new IllegalArgumentException("Attachment not found");
        }
        return resource;
    }

    public void delete(String storageKey) throws IOException {
        Files.deleteIfExists(resolve(storageKey));
    }

    private Path resolve(String storageKey) {
        if (storageKey == null ||
                !storageKey.matches(
                        "[0-9a-fA-F-]{36}/[0-9a-fA-F-]{36}/" +
                                "[0-9a-fA-F-]{36}\\.(jpg|png|webp|pdf|txt|csv)"
                )) {
            throw new IllegalArgumentException("Invalid attachment key");
        }

        Path file = storageDirectory.resolve(storageKey).normalize();
        if (!file.startsWith(storageDirectory)) {
            throw new IllegalArgumentException("Invalid attachment key");
        }
        return file;
    }

    private FileType detectType(MultipartFile file) throws IOException {
        String originalName = file.getOriginalFilename();
        String extension = originalName == null || !originalName.contains(".")
                ? ""
                : originalName.substring(originalName.lastIndexOf('.') + 1)
                        .toLowerCase(Locale.ROOT);
        String suppliedMime = file.getContentType();

        byte[] prefix = new byte[12];
        int length;
        try (InputStream input = file.getInputStream()) {
            length = input.read(prefix);
        }

        FileType type = switch (extension) {
            case "jpg", "jpeg" -> startsWith(prefix, length, 0xff, 0xd8, 0xff)
                    ? new FileType("jpg", "image/jpeg") : null;
            case "png" -> startsWith(prefix, length, 0x89, 0x50, 0x4e, 0x47,
                    0x0d, 0x0a, 0x1a, 0x0a)
                    ? new FileType("png", "image/png") : null;
            case "webp" -> length >= 12 &&
                    ascii(prefix, 0, "RIFF") &&
                    ascii(prefix, 8, "WEBP")
                    ? new FileType("webp", "image/webp") : null;
            case "pdf" -> ascii(prefix, 0, "%PDF-")
                    ? new FileType("pdf", "application/pdf") : null;
            case "txt", "csv" -> isText(prefix, length)
                    ? new FileType(extension,
                            extension.equals("csv") ? "text/csv" : "text/plain")
                    : null;
            default -> null;
        };

        if (type == null) {
            throw new IllegalArgumentException(
                    "Use a JPG, PNG, WEBP, PDF, TXT, or CSV attachment"
            );
        }

        if (suppliedMime != null && !suppliedMime.isBlank() &&
                !suppliedMime.equalsIgnoreCase(type.mimeType()) &&
                !suppliedMime.equalsIgnoreCase("application/octet-stream")) {
            throw new IllegalArgumentException(
                    "Attachment content does not match its file type"
            );
        }
        return type;
    }

    private String requireUuid(String value) {
        try {
            return UUID.fromString(value).toString();
        } catch (IllegalArgumentException exception) {
            throw new IllegalArgumentException("Invalid attachment owner");
        }
    }

    private boolean startsWith(byte[] bytes, int length, int... signature) {
        if (length < signature.length) {
            return false;
        }
        for (int index = 0; index < signature.length; index++) {
            if ((bytes[index] & 0xff) != signature[index]) {
                return false;
            }
        }
        return true;
    }

    private boolean ascii(byte[] bytes, int offset, String expected) {
        if (bytes.length < offset + expected.length()) {
            return false;
        }
        for (int index = 0; index < expected.length(); index++) {
            if (bytes[offset + index] != (byte) expected.charAt(index)) {
                return false;
            }
        }
        return true;
    }

    private boolean isText(byte[] bytes, int length) {
        for (int index = 0; index < length; index++) {
            int value = bytes[index] & 0xff;
            if ((value < 0x20 && value != '\t' && value != '\n' &&
                    value != '\r') || value == 0x7f) {
                return false;
            }
        }
        return true;
    }

    private record FileType(String extension, String mimeType) {
    }

    public record StoredFile(String storageKey, String mimeType) {
    }
}
