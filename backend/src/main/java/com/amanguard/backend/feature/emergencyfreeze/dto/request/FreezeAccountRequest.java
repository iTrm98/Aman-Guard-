package com.amanguard.backend.feature.emergencyfreeze.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record FreezeAccountRequest(

        @NotNull(message = "رقم حالة الاحتيال مطلوب")
        Long caseId,

        @NotBlank(message = "سبب طلب التجميد مطلوب")
        @Size(
                max = 255,
                message = "يجب ألا يتجاوز السبب 255 حرفًا"
        )
        String reason

) {
}