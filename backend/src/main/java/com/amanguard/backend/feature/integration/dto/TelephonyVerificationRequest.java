package com.amanguard.backend.feature.integration.dto;

import jakarta.validation.constraints.NotBlank;

public record TelephonyVerificationRequest(
        @NotBlank(message = "رقم المتصل مطلوب")
        String callerNumber,

        @NotBlank(message = "اسم الجهة المدعاة مطلوب")
        String claimedInstitution,

        String customerPhoneNumber
) {
}