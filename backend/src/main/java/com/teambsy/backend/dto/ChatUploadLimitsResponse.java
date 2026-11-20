package com.teambsy.backend.dto;

public class ChatUploadLimitsResponse {

    public long maxFileSizeBytes;
    public int maxFilesPerMessage;

    public ChatUploadLimitsResponse(
            long maxFileSizeBytes,
            int maxFilesPerMessage
    ) {
        this.maxFileSizeBytes = maxFileSizeBytes;
        this.maxFilesPerMessage = maxFilesPerMessage;
    }
}
