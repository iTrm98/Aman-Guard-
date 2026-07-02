package com.amanguard.backend.feature.customers.dto.response;

public record CustomerResponse(
        String name,
        String nameEn,
        String accountNumber,
        String phone,
        Long customerId
) {
}
