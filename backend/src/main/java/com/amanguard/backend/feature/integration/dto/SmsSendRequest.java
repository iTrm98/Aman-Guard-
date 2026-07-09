package com.amanguard.backend.feature.integration.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record SmsSendRequest(
        @NotBlank(message = "رقم الجوال مطلوب")
        String phoneNumber,

        @NotBlank(message = "نص الرسالة مطلوب")
        @Size(max = 500, message = "نص الرسالة يجب ألا يتجاوز 500 حرف")
        String message,

        String purpose
) {
}