package com.amanguard.backend.feature.dashboard.dto.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

// All fields optional — only non-null values are applied to the case.
public record UpdateCaseRequest(

        @Size(max = 100, message = "يجب ألا يتجاوز اسم العميل 100 حرف")
        String customerName,

        @Size(max = 200, message = "يجب ألا يتجاوز نمط الاحتيال 200 حرف")
        String fraudPattern,

        @Min(value = 0, message = "درجة الخطر يجب أن تكون بين 0 و 100")
        @Max(value = 100, message = "درجة الخطر يجب أن تكون بين 0 و 100")
        Integer riskScore,

        @Pattern(
                regexp = "active|partially_restricted|frozen",
                message = "حالة الحساب غير صالحة"
        )
        String accountStatus,

        @Size(max = 2000, message = "يجب ألا تتجاوز الملاحظات 2000 حرف")
        String notes

) {
}
