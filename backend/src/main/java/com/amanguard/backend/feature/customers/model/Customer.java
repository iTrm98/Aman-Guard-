package com.amanguard.backend.feature.customers.model;

import jakarta.persistence.*;

@Entity
@Table(name = "customers")
public class Customer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(
            name = "national_id",
            nullable = false,
            unique = true,
            length = 20
    )
    private String nationalId;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(name = "name_en", nullable = false, length = 100)
    private String nameEn;

    @Column(name = "account_number", nullable = false, length = 34)
    private String accountNumber;

    @Column(nullable = false, length = 20)
    private String phone;

    public Customer() {
    }

    public Customer(
            String nationalId,
            String name,
            String nameEn,
            String accountNumber,
            String phone
    ) {
        this.nationalId = nationalId;
        this.name = name;
        this.nameEn = nameEn;
        this.accountNumber = accountNumber;
        this.phone = phone;
    }

    public Long getId() {
        return id;
    }

    public String getNationalId() {
        return nationalId;
    }

    public String getName() {
        return name;
    }

    public String getNameEn() {
        return nameEn;
    }

    public String getAccountNumber() {
        return accountNumber;
    }

    public String getPhone() {
        return phone;
    }
}
