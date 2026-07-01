package com.amanguard.backend.feature.verification.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.List;

public record EvaluateVerificationRequest(

        @NotNull(message = "رقم حالة الاحتيال مطلوب")
        Long caseId,

        @NotEmpty(message = "يجب إرسال إجابات أسئلة التحقق")
        @Size(
                min = 3,
                max = 3,
                message = "يجب الإجابة عن أسئلة التحقق الثلاثة"
        )
        List<@Valid VerificationAnswerRequest> answers

) {
}