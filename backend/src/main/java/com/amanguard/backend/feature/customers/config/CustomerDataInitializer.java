package com.amanguard.backend.feature.customers.config;

import com.amanguard.backend.feature.customers.model.Customer;
import com.amanguard.backend.feature.customers.repository.CustomerRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class CustomerDataInitializer {

    @Bean
    public CommandLineRunner initializeCustomers(
            CustomerRepository customerRepository
    ) {
        return args -> {
            if (customerRepository.count() > 0) {
                return;
            }

            customerRepository.save(new Customer(
                    "1010101010",
                    "تركي السفياني",
                    "Turki Al-Sufyani",
                    "SA4420000001234567891234",
                    "0551112222"
            ));

            customerRepository.save(new Customer(
                    "2020202020",
                    "محمد الزهراني",
                    "Mohammed Al-Zahrani",
                    "SA4420000005678901234567",
                    "0553334444"
            ));

            customerRepository.save(new Customer(
                    "3030303030",
                    "نواف العتيبي",
                    "Nawaf Al-Otaibi",
                    "SA0000000000000000004821",
                    "0555556666"
            ));

            customerRepository.save(new Customer(
                    "4040404040",
                    "أحمد الحربي",
                    "Ahmed Al-Harbi",
                    "SA4420000009012345678901",
                    "0557778888"
            ));
        };
    }
}
