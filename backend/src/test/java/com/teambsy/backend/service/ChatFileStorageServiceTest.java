package com.teambsy.backend.service;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.mock.web.MockMultipartFile;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertArrayEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class ChatFileStorageServiceTest {

    @TempDir
    Path storageDirectory;

    @Test
    void storesImagesWithGeneratedConversationScopedKeys() throws Exception {
        ChatFileStorageService storage = new ChatFileStorageService(
                storageDirectory.toString(),
                1024
        );
        byte[] pngSignature = {
                (byte) 0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a
        };
        MockMultipartFile upload = new MockMultipartFile(
                "files",
                "../../private.png",
                "image/png",
                pngSignature
        );
        String conversationId = UUID.randomUUID().toString();
        String userId = UUID.randomUUID().toString();

        ChatFileStorageService.StoredFile saved =
                storage.save(conversationId, userId, upload);

        assertTrue(saved.storageKey().startsWith(
                conversationId + "/" + userId + "/"
        ));
        assertTrue(saved.storageKey().matches(
                "[0-9a-f-]{36}/[0-9a-f-]{36}/[0-9a-f-]{36}\\.png"
        ));
        assertArrayEquals(
                pngSignature,
                Files.readAllBytes(storageDirectory.resolve(saved.storageKey()))
        );
    }

    @Test
    void rejectsMismatchedTypesAndOversizedFiles() {
        ChatFileStorageService storage = new ChatFileStorageService(
                storageDirectory.toString(),
                4
        );
        String conversationId = UUID.randomUUID().toString();
        String userId = UUID.randomUUID().toString();
        MockMultipartFile invalidImage = new MockMultipartFile(
                "files",
                "image.png",
                "image/png",
                new byte[] { 1, 2, 3 }
        );
        MockMultipartFile oversized = new MockMultipartFile(
                "files",
                "file.pdf",
                "application/pdf",
                new byte[] { '%', 'P', 'D', 'F', '-' }
        );

        assertThrows(
                IllegalArgumentException.class,
                () -> storage.save(conversationId, userId, invalidImage)
        );
        assertThrows(
                IllegalArgumentException.class,
                () -> storage.save(conversationId, userId, oversized)
        );
    }
}
