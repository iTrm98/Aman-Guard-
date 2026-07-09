package com.amanguard.backend.feature.auth.dto.request;

import jakarta.validation.constraints.NotBlank;

public record OtpRequest(
        @NotBlank(message = "رقم الهوية أو رقم الحساب مطلوب")
        String identifier
) {
}