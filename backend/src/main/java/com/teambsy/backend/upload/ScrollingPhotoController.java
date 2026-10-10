
package com.teambsy.backend.upload;

import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

@RestController
@RequestMapping("/api/scrolling-photos")
public class ScrollingPhotoController {

    private final JdbcTemplate jdbcTemplate;

    private final Path uploadDirectory =
            Paths.get("uploads", "scrolling-photos")
                    .toAbsolutePath()
                    .normalize();

    public ScrollingPhotoController(JdbcTemplate jdbcTemplate) {
    this.jdbcTemplate = jdbcTemplate;
}

    // All authenticated roles can view the shared scrolling photos.
    @GetMapping
    public ResponseEntity<?> getPhotos() {

        List<Map<String, Object>> photos = jdbcTemplate.query(
                """
                SELECT id, file_name, image_url, uploaded_by, created_at
                FROM scrolling_photos
                ORDER BY created_at DESC, id DESC
                """,
                (rs, rowNum) -> {
                    Map<String, Object> photo = new LinkedHashMap<>();
                    photo.put("id", rs.getLong("id"));
                    photo.put("fileName", rs.getString("file_name"));
                    photo.put("imageUrl", rs.getString("image_url"));
                    photo.put("uploadedBy", rs.getString("uploaded_by"));
                    photo.put("createdAt", rs.getTimestamp("created_at").toString());
                    return photo;
                }
        );

        return ResponseEntity.ok(photos);
    }

    // Admin-only upload. SecurityConfig must enforce ADMIN permission.
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> uploadPhoto(
            @RequestParam("file") MultipartFile file,
            Authentication authentication) {

        if (file == null || file.isEmpty()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Please select a photo."));
        }

        String contentType = file.getContentType();

        if (contentType == null ||
                !contentType.toLowerCase(Locale.ROOT).startsWith("image/")) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Only image files are allowed."));
        }

        String originalName =
                Optional.ofNullable(file.getOriginalFilename()).orElse("");

        int dot = originalName.lastIndexOf('.');
        String extension = dot >= 0
                ? originalName.substring(dot).toLowerCase(Locale.ROOT)
                : "";

        if (!Set.of(".jpg", ".jpeg", ".png", ".webp", ".gif")
                .contains(extension)) {
            return ResponseEntity.badRequest().body(Map.of(
                    "message", "Supported formats: JPG, JPEG, PNG, WEBP, GIF."
            ));
        }

        String fileName = UUID.randomUUID() + extension;
        String imageUrl = "/uploads/scrolling-photos/" + fileName;

        Path destination = uploadDirectory.resolve(fileName).normalize();

        if (!destination.startsWith(uploadDirectory)) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Invalid file path."));
        }

        try {
            Files.createDirectories(uploadDirectory);
            file.transferTo(destination.toFile());

            String uploadedBy = authentication != null
                    ? authentication.getName()
                    : "unknown";

            try {
                jdbcTemplate.update(
                        """
                        INSERT INTO scrolling_photos
                            (file_name, image_url, uploaded_by)
                        VALUES (?, ?, ?)
                        """,
                        fileName, imageUrl, uploadedBy
                );
            } catch (Exception databaseException) {
                Files.deleteIfExists(destination);
                throw databaseException;
            }

            Long id = jdbcTemplate.queryForObject(
                    "SELECT id FROM scrolling_photos WHERE file_name = ?",
                    Long.class,
                    fileName
            );

            return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                    "message", "Scrolling photo uploaded successfully.",
                    "id", id,
                    "fileName", fileName,
                    "imageUrl", imageUrl
            ));

        } catch (IOException e) {
            return ResponseEntity.internalServerError()
                    .body(Map.of("message", "Could not save the image file."));
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body(Map.of("message", "Could not save the scrolling photo record."));
        }
    }

    // Admin-only deletion. Deletes the database row and image file.
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deletePhoto(@PathVariable long id) {

        List<String> fileNames = jdbcTemplate.query(
                "SELECT file_name FROM scrolling_photos WHERE id = ?",
                (rs, rowNum) -> rs.getString("file_name"),
                id
        );

        if (fileNames.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", "Scrolling photo not found."));
        }

        String fileName = fileNames.get(0);

        int deleted = jdbcTemplate.update(
                "DELETE FROM scrolling_photos WHERE id = ?",
                id
        );

        if (deleted == 0) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", "Scrolling photo not found."));
        }

        try {
            Path filePath = uploadDirectory.resolve(fileName).normalize();

            if (filePath.startsWith(uploadDirectory)) {
                Files.deleteIfExists(filePath);
            }
        } catch (IOException e) {
            System.err.println(
                    "Could not delete scrolling photo file: " + fileName
            );
        }

        return ResponseEntity.ok(Map.of(
                "message", "Scrolling photo removed successfully.",
                "id", id
        ));
    }
}
