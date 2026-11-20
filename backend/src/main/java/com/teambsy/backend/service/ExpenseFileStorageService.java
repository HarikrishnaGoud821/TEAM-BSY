package com.teambsy.backend.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

@Service
public class ExpenseFileStorageService {

    private final Path storageDirectory;

    public ExpenseFileStorageService(
            @Value("${team-bsy.upload-dir}") String uploadDir
    ) {
        this.storageDirectory = Path.of(uploadDir)
                .toAbsolutePath()
                .normalize();
    }

    public String save(MultipartFile file) throws IOException {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Attach a shop receipt");
        }

        if (file.getSize() > 5L * 1024 * 1024) {
            throw new IllegalArgumentException("Receipt must be under 5 MB");
        }

        String extension = switch (file.getContentType() == null
                ? "" : file.getContentType().toLowerCase()) {
            case "image/jpeg" -> "jpg";
            case "image/png" -> "png";
            case "image/webp" -> "webp";
            case "application/pdf" -> "pdf";
            default -> throw new IllegalArgumentException(
                    "Use a JPG, PNG, WEBP photo or a PDF"
            );
        };

        Files.createDirectories(storageDirectory);

        String fileKey = UUID.randomUUID() + "." + extension;
        Path target = storageDirectory.resolve(fileKey).normalize();

        if (!target.startsWith(storageDirectory)) {
            throw new IllegalArgumentException("Invalid receipt filename");
        }

        Files.copy(file.getInputStream(), target);

        return fileKey;
    }

    public Resource load(String fileKey) throws IOException {
        if (fileKey == null ||
                !fileKey.matches("[a-f0-9-]{36}\\.(jpg|png|webp|pdf)")) {
            throw new IllegalArgumentException("Invalid receipt file");
        }

        Path file = storageDirectory.resolve(fileKey).normalize();

        if (!file.startsWith(storageDirectory) ||
                !Files.exists(file) ||
                !Files.isReadable(file)) {
            throw new IllegalArgumentException("Receipt file not found");
        }

        Resource resource = new UrlResource(file.toUri());

        if (!resource.exists() || !resource.isReadable()) {
            throw new IllegalArgumentException("Receipt file not found");
        }

        return resource;
    }

    public void delete(String fileKey) {
        if (fileKey == null ||
                !fileKey.matches("[a-f0-9-]{36}\\.(jpg|png|webp|pdf)")) {
            return;
        }

        try {
            Path file = storageDirectory.resolve(fileKey).normalize();

            if (file.startsWith(storageDirectory)) {
                Files.deleteIfExists(file);
            }
        } catch (IOException ignored) {
            // Cleanup failure must not hide the original error.
        }
    }
}