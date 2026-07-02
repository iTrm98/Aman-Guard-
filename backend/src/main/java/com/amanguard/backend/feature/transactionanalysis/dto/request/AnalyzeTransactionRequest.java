package com.amanguard.backend.feature.transactionanalysis.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record AnalyzeTransactionRequest(

        @NotBlank(message = "اسم المتجر مطلوب")
        String merchantName,

        @NotNull(message = "مبلغ العملية مطلوب")
        @DecimalMin(
                value = "1.00",
                message = "يجب أن يكون مبلغ العملية ريالًا واحدًا على الأقل"
        )
        BigDecimal amount,

        String currency,

        String merchantUrl,

        String transactionType,

        String accountId

) {
}
