package com.amanguard.backend.feature.transactionanalysis.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record AnalyzeTransactionRequest(

        @NotNull(message = "مبلغ التحويل مطلوب")
        @DecimalMin(
                value = "1.00",
                message = "يجب أن يكون مبلغ التحويل ريالًا واحدًا على الأقل"
        )
        BigDecimal amount,

        boolean newBeneficiary,

        boolean callerRequestedTransfer,

        boolean otpRequested,

        boolean urgentRequest,

        boolean unusualTime

) {
}