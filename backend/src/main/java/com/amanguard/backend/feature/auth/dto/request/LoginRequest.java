package com.amanguard.backend.feature.auth.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record LoginRequest(
        @NotBlank(message = "رقم الهوية أو رقم الحساب مطلوب")
        String identifier,

        @NotBlank(message = "رمز التحقق OTP مطلوب")
        @Size(min = 4, max = 8, message = "رمز التحقق غير صحيح")
        String otp,

        String pin
) {
}