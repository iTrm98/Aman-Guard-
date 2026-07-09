package com.amanguard.backend.feature.auth.dto.response;

import java.time.Instant;

public record OtpResponse(
        String message,
        Instant expiresAt,

        // للهاكاثون فقط. في الإنتاج لا ترجع OTP للفرونت أبدًا.
        String demoOtp
) {
}