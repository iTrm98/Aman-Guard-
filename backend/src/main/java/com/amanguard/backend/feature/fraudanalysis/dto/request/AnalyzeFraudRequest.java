package com.amanguard.backend.feature.fraudanalysis.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record AnalyzeFraudRequest(

        @NotBlank(message = "يجب إدخال نص الرسالة أو الرابط")
        @Size(
                max = 5000,
                message = "يجب ألا يتجاوز النص 5000 حرف"
        )
        String text

) {
}