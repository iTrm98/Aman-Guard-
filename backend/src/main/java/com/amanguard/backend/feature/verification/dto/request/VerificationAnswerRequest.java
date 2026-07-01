package com.amanguard.backend.feature.verification.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record VerificationAnswerRequest(

        @NotBlank(message = "رقم سؤال التحقق مطلوب")
        String questionId,

        @NotNull(message = "إجابة سؤال التحقق مطلوبة")
        Boolean answer

) {
}