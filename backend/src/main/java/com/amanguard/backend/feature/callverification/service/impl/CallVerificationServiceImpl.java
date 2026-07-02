package com.amanguard.backend.feature.callverification.service.impl;

import com.amanguard.backend.feature.callverification.dto.response.CallStatusResponse;
import com.amanguard.backend.feature.callverification.repository.BankCallRepository;
import com.amanguard.backend.feature.callverification.service.CallVerificationService;
import org.springframework.stereotype.Service;

@Service
public class CallVerificationServiceImpl
        implements CallVerificationService {

    // Active-calls registry (BankCall rows). Once telephony integration is
    // ready, verifyCall() will match the current user's registered phone
    // number against active official calls in this repository.
    private final BankCallRepository bankCallRepository;

    public CallVerificationServiceImpl(
            BankCallRepository bankCallRepository
    ) {
        this.bankCallRepository = bankCallRepository;
    }

    @Override
    public CallStatusResponse verifyCall() {
        // TODO: integrate with bank telephony system to check real active calls
        // against the current authenticated user's registered phone number.
        // The frontend never supplies a phone number — the bank already knows
        // the user's registered number from their account.
        return new CallStatusResponse(false,
                "لا يوجد اتصال بنكي رسمي نشط حالياً. إذا كان شخص ما يدّعي أنه من البنك، أغلق الخط فوراً.");
    }
}
