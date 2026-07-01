package com.amanguard.backend.feature.callverification.service.impl;

import com.amanguard.backend.feature.callverification.dto.response.CallStatusResponse;
import com.amanguard.backend.feature.callverification.model.BankCall;
import com.amanguard.backend.feature.callverification.repository.BankCallRepository;
import com.amanguard.backend.feature.callverification.service.CallVerificationService;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class CallVerificationServiceImpl
        implements CallVerificationService {

    private final BankCallRepository bankCallRepository;

    public CallVerificationServiceImpl(
            BankCallRepository bankCallRepository
    ) {
        this.bankCallRepository = bankCallRepository;
    }

    @Override
    public CallStatusResponse verifyCall(String phoneNumber) {
        if (phoneNumber == null || phoneNumber.isBlank()) {
            return new CallStatusResponse(
                    false,
                    "لا يوجد تواصل رسمي نشط من البنك. لا تشارك رمز OTP أو بياناتك البنكية."
            );
        }

        String cleanPhoneNumber = phoneNumber.trim();

        Optional<BankCall> bankCallOptional =
                bankCallRepository
                        .findFirstByCallerNumberAndActiveTrueOrderByStartedAtDesc(
                                cleanPhoneNumber
                        );

        if (bankCallOptional.isEmpty()) {
            return new CallStatusResponse(
                    false,
                    "الرقم غير موجود ضمن الاتصالات الرسمية المسجلة من البنك."
            );
        }

        BankCall bankCall = bankCallOptional.get();

        if (!bankCall.isOfficialCall()) {
            return new CallStatusResponse(
                    false,
                    "هذا الرقم غير معتمد كرقم رسمي للبنك. أنهِ المكالمة ولا تشارك أي معلومات."
            );
        }

        return new CallStatusResponse(
                true,
                "تم التحقق: يوجد اتصال رسمي نشط من "
                        + bankCall.getCallerName()
                        + "."
        );
    }
}