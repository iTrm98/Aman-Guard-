package com.amanguard.backend.feature.customers.service;

import com.amanguard.backend.feature.customers.dto.response.CustomerResponse;

public interface CustomerService {

    CustomerResponse getByNationalId(String nationalId);
}
