package com.amanguard.backend.feature.auth.dto.request;

import jakarta.validation.constraints.NotBlank;

public record LoginRequest(
        @NotBlank(message = "رقم الهوية الوطنية مطلوب")
        String nationalId,

        @NotBlank(message = "كلمة المرور مطلوبة")
        String password
) {
}
