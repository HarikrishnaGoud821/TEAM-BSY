
package com.teambsy.backend.config;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, String>> handleValidation(
            MethodArgumentNotValidException exception
    ) {
        String message = exception.getBindingResult()
                .getFieldErrors()
                .stream()
                .findFirst()
                .map(error -> error.getDefaultMessage())
                .orElse("Invalid request");

        return ResponseEntity
                .badRequest()
                .body(Map.of("message", message));
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, String>> handleBadRequest(
            IllegalArgumentException exception
    ) {
        return ResponseEntity
                .badRequest()
                .body(Map.of("message", exception.getMessage()));
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<Map<String, String>> handleAccessDenied(
            AccessDeniedException exception
    ) {
        return ResponseEntity
                .status(HttpStatus.FORBIDDEN)
                .body(Map.of("message", "You are not allowed to perform this action"));
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<Map<String, String>> handleConflict(
            DataIntegrityViolationException exception
    ) {
        return ResponseEntity
                .status(HttpStatus.CONFLICT)
                .body(Map.of("message", "Email or mobile number is already registered"));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, String>> handleGeneral(
            Exception exception
    ) {
        return ResponseEntity
                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("message", "An unexpected server error occurred"));
    }
}
