package com.amanguard.backend.feature.dashboard.dto.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record CreateCaseRequest(

        @NotBlank(message = "رقم الهوية مطلوب")
        @Size(max = 20, message = "يجب ألا يتجاوز رقم الهوية 20 خانة")
        String nationalId,

        @NotBlank(message = "اسم العميل مطلوب")
        @Size(max = 100, message = "يجب ألا يتجاوز اسم العميل 100 حرف")
        String customerName,

        @Size(max = 34, message = "يجب ألا يتجاوز رقم الحساب 34 خانة")
        String accountNumber,

        @Size(max = 20, message = "يجب ألا يتجاوز رقم الجوال 20 خانة")
        String phone,

        @NotBlank(message = "نمط الاحتيال مطلوب")
        @Size(max = 200, message = "يجب ألا يتجاوز نمط الاحتيال 200 حرف")
        String fraudPattern,

        @Size(max = 2000, message = "يجب ألا يتجاوز الوصف 2000 حرف")
        String description,

        @NotNull(message = "درجة الخطر مطلوبة")
        @Min(value = 0, message = "درجة الخطر يجب أن تكون بين 0 و 100")
        @Max(value = 100, message = "درجة الخطر يجب أن تكون بين 0 و 100")
        Integer riskScore,

        @NotBlank(message = "الإجراء الفوري مطلوب")
        @Pattern(
                regexp = "monitor|freeze|close",
                message = "الإجراء الفوري غير صالح"
        )
        String immediateAction

) {
}
