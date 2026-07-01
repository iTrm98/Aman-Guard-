package com.amanguard.backend.feature.callverification.dto.response;

public record CallStatusResponse(
        boolean hasActiveOfficialCall,
        String message
) {
}