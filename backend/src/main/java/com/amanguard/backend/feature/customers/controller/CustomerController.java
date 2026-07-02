package com.amanguard.backend.feature.customers.controller;

import com.amanguard.backend.feature.customers.dto.response.CustomerResponse;
import com.amanguard.backend.feature.customers.service.CustomerService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/customers")
public class CustomerController {

    private final CustomerService customerService;

    public CustomerController(
            CustomerService customerService
    ) {
        this.customerService = customerService;
    }

    @GetMapping("/{nationalId}")
    public ResponseEntity<CustomerResponse> getByNationalId(
            @PathVariable String nationalId
    ) {
        return ResponseEntity.ok(
                customerService.getByNationalId(nationalId)
        );
    }
}
