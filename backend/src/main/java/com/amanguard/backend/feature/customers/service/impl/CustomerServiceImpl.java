package com.amanguard.backend.feature.customers.service.impl;

import com.amanguard.backend.common.exception.ResourceNotFoundException;
import com.amanguard.backend.feature.customers.dto.response.CustomerResponse;
import com.amanguard.backend.feature.customers.model.Customer;
import com.amanguard.backend.feature.customers.repository.CustomerRepository;
import com.amanguard.backend.feature.customers.service.CustomerService;
import org.springframework.stereotype.Service;

@Service
public class CustomerServiceImpl implements CustomerService {

    private final CustomerRepository customerRepository;

    public CustomerServiceImpl(
            CustomerRepository customerRepository
    ) {
        this.customerRepository = customerRepository;
    }

    @Override
    public CustomerResponse getByNationalId(String nationalId) {
        Customer customer = customerRepository
                .findByNationalId(nationalId.trim())
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "لم يتم العثور على عميل بهذا الرقم."
                        )
                );

        return new CustomerResponse(
                customer.getName(),
                customer.getNameEn(),
                customer.getAccountNumber(),
                customer.getPhone(),
                customer.getId()
        );
    }
}
