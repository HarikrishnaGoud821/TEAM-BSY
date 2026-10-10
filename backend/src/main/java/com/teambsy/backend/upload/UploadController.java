package com.teambsy.backend.upload;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Stream;

@RestController
@RequestMapping("/api/upload")
public class UploadController {

    private final Path uploadDirectory =
            Paths.get("uploads");

    /**
     * Upload a photo.
     *
     * POST /api/upload/photo
     */
    @PostMapping("/photo")
    public ResponseEntity<?> uploadPhoto(
            @RequestParam("file") MultipartFile file) {

        try {

            if (file == null || file.isEmpty()) {
                return ResponseEntity.badRequest()
                        .body("Photo file is required");
            }

            String contentType = file.getContentType();

            if (contentType == null ||
                    !contentType.startsWith("image/")) {

                return ResponseEntity.badRequest()
                        .body("Only image files are allowed");
            }

            Files.createDirectories(uploadDirectory);

            String originalName = file.getOriginalFilename();

            String extension = ".jpg";

            if (originalName != null &&
                    originalName.contains(".")) {

                extension = originalName.substring(
                        originalName.lastIndexOf(".")
                ).toLowerCase();
            }

            String fileName =
                    UUID.randomUUID() + extension;

            Path filePath =
                    uploadDirectory.resolve(fileName);

            Files.write(
                    filePath,
                    file.getBytes()
            );

            String imageUrl =
                    "/uploads/" + fileName;

            return ResponseEntity.ok(
                    Map.of(
                            "message", "Photo uploaded successfully",
                            "fileName", fileName,
                            "imageUrl", imageUrl
                    )
            );

        } catch (IOException e) {

            return ResponseEntity.internalServerError()
                    .body("Failed to upload photo");
        }
    }

    /**
     * Get all uploaded photos.
     *
     * GET /api/upload/photos
     */
    @GetMapping("/photos")
    public ResponseEntity<?> getPhotos() {

        try {

            Files.createDirectories(uploadDirectory);

            List<Map<String, Object>> photos =
                    new ArrayList<>();

            try (Stream<Path> files =
                         Files.list(uploadDirectory)) {

                files
                        .filter(Files::isRegularFile)
                        .filter(this::isImageFile)
                        .sorted(
                                Comparator.comparing(
                                        this::getLastModified
                                ).reversed()
                        )
                        .forEach(path -> {

                            String fileName =
                                    path.getFileName()
                                            .toString();

                            String imageUrl =
                                    "/uploads/" + fileName;

                            photos.add(
                                    Map.of(
                                            "id", fileName,
                                            "fileName", fileName,
                                            "url", imageUrl
                                    )
                            );
                        });
            }

            return ResponseEntity.ok(photos);

        } catch (IOException e) {

            return ResponseEntity.internalServerError()
                    .body("Failed to load photos");
        }
    }

    /**
     * Check whether a file is an image.
     */
    private boolean isImageFile(Path path) {

        String fileName =
                path.getFileName()
                        .toString()
                        .toLowerCase();

        return fileName.endsWith(".jpg")
                || fileName.endsWith(".jpeg")
                || fileName.endsWith(".png")
                || fileName.endsWith(".webp")
                || fileName.endsWith(".gif");
    }

    /**
     * Get file modification time.
     */
    private long getLastModified(Path path) {

        try {

            return Files.getLastModifiedTime(path)
                    .toMillis();

        } catch (IOException e) {

            return 0L;
        }
    }
}