package com.amanguard.backend.feature.customers.repository;

import com.amanguard.backend.feature.customers.model.Customer;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface CustomerRepository
        extends JpaRepository<Customer, Long> {

    Optional<Customer> findByNationalId(String nationalId);
}
