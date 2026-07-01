package com.amanguard.backend.feature.emergencyfreeze.service.impl;

import com.amanguard.backend.common.exception.BadRequestException;
import com.amanguard.backend.common.exception.ResourceNotFoundException;
import com.amanguard.backend.feature.emergencyfreeze.dto.response.FreezeAccountResponse;
import com.amanguard.backend.feature.emergencyfreeze.dto.response.FreezeRequestStatusResponse;
import com.amanguard.backend.feature.emergencyfreeze.model.FreezeRequest;
import com.amanguard.backend.feature.emergencyfreeze.model.FreezeStatus;
import com.amanguard.backend.feature.emergencyfreeze.repository.FreezeRequestRepository;
import com.amanguard.backend.feature.emergencyfreeze.service.EmergencyFreezeService;
import com.amanguard.backend.feature.fraudanalysis.repository.FraudCaseRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Locale;
import java.util.Optional;
import java.util.UUID;

@Service
public class EmergencyFreezeServiceImpl
        implements EmergencyFreezeService {

    private final FreezeRequestRepository freezeRequestRepository;
    private final FraudCaseRepository fraudCaseRepository;

    public EmergencyFreezeServiceImpl(
            FreezeRequestRepository freezeRequestRepository,
            FraudCaseRepository fraudCaseRepository
    ) {
        this.freezeRequestRepository =
                freezeRequestRepository;

        this.fraudCaseRepository =
                fraudCaseRepository;
    }

    @Override
    @Transactional
    public FreezeAccountResponse requestFreeze(
            Long caseId,
            String reason
    ) {
        validateFraudCase(caseId);

        Optional<FreezeRequest> latestRequest =
                freezeRequestRepository
                        .findFirstByFraudCaseIdOrderByCreatedAtDesc(
                                caseId
                        );

        if (latestRequest.isPresent()) {
            FreezeRequest existingRequest =
                    latestRequest.get();

            if (existingRequest.getStatus()
                    == FreezeStatus.PENDING) {

                return new FreezeAccountResponse(
                        existingRequest.getId(),
                        true,
                        existingRequest.getReportNumber(),
                        createStatusValue(
                                existingRequest.getStatus()
                        ),
                        "يوجد طلب تجميد قيد المراجعة بالفعل."
                );
            }

            if (existingRequest.getStatus()
                    == FreezeStatus.APPROVED) {

                return new FreezeAccountResponse(
                        existingRequest.getId(),
                        true,
                        existingRequest.getReportNumber(),
                        createStatusValue(
                                existingRequest.getStatus()
                        ),
                        "الحساب مجمد احترازيًا بالفعل."
                );
            }
        }

        FreezeRequest freezeRequest = new FreezeRequest(
                caseId,
                reason.trim(),
                FreezeStatus.PENDING,
                generateReportNumber()
        );

        FreezeRequest savedRequest =
                freezeRequestRepository.save(freezeRequest);

        return new FreezeAccountResponse(
                savedRequest.getId(),
                true,
                savedRequest.getReportNumber(),
                createStatusValue(savedRequest.getStatus()),
                "تم إرسال طلب التجميد إلى موظف البنك للمراجعة."
        );
    }

    @Override
    @Transactional(readOnly = true)
    public FreezeRequestStatusResponse getRequestStatus(
            Long requestId
    ) {
        FreezeRequest freezeRequest =
                findFreezeRequest(requestId);

        return createStatusResponse(
                freezeRequest,
                createStatusMessage(freezeRequest.getStatus())
        );
    }

    @Override
    @Transactional
    public FreezeRequestStatusResponse approveRequest(
            Long requestId
    ) {
        FreezeRequest freezeRequest =
                findFreezeRequest(requestId);

        if (freezeRequest.getStatus()
                == FreezeStatus.APPROVED) {

            return createStatusResponse(
                    freezeRequest,
                    "طلب التجميد معتمد بالفعل."
            );
        }

        if (freezeRequest.getStatus()
                == FreezeStatus.REJECTED) {

            throw new BadRequestException(
                    "لا يمكن اعتماد طلب تم رفضه مسبقًا"
            );
        }

        freezeRequest.approve();

        FreezeRequest savedRequest =
                freezeRequestRepository.save(freezeRequest);

        return createStatusResponse(
                savedRequest,
                "تم اعتماد طلب التجميد وتجميد الحساب احترازيًا."
        );
    }

    @Override
    @Transactional
    public FreezeRequestStatusResponse rejectRequest(
            Long requestId
    ) {
        FreezeRequest freezeRequest =
                findFreezeRequest(requestId);

        if (freezeRequest.getStatus()
                == FreezeStatus.REJECTED) {

            return createStatusResponse(
                    freezeRequest,
                    "طلب التجميد مرفوض بالفعل."
            );
        }

        if (freezeRequest.getStatus()
                == FreezeStatus.APPROVED) {

            throw new BadRequestException(
                    "لا يمكن رفض طلب تم اعتماده مسبقًا"
            );
        }

        freezeRequest.reject();

        FreezeRequest savedRequest =
                freezeRequestRepository.save(freezeRequest);

        return createStatusResponse(
                savedRequest,
                "تم رفض طلب التجميد بعد مراجعة الحالة."
        );
    }

    private void validateFraudCase(Long caseId) {
        boolean fraudCaseExists =
                fraudCaseRepository.existsById(caseId);

        if (!fraudCaseExists) {
            throw new ResourceNotFoundException(
                    "حالة الاحتيال غير موجودة: "
                            + caseId
            );
        }
    }

    private FreezeRequest findFreezeRequest(
            Long requestId
    ) {
        return freezeRequestRepository
                .findById(requestId)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "طلب التجميد غير موجود: "
                                        + requestId
                        )
                );
    }

    private FreezeRequestStatusResponse createStatusResponse(
            FreezeRequest freezeRequest,
            String message
    ) {
        return new FreezeRequestStatusResponse(
                freezeRequest.getId(),
                freezeRequest.getFraudCaseId(),
                freezeRequest.getReportNumber(),
                createStatusValue(
                        freezeRequest.getStatus()
                ),
                message,
                freezeRequest.getCreatedAt(),
                freezeRequest.getUpdatedAt()
        );
    }

    private String createStatusValue(
            FreezeStatus status
    ) {
        return status.name()
                .toLowerCase(Locale.ROOT);
    }

    private String createStatusMessage(
            FreezeStatus status
    ) {
        return switch (status) {
            case PENDING ->
                    "طلب التجميد قيد مراجعة موظف البنك.";

            case APPROVED ->
                    "تم اعتماد الطلب وتجميد الحساب احترازيًا.";

            case REJECTED ->
                    "تم رفض طلب التجميد بعد المراجعة.";
        };
    }

    private String generateReportNumber() {
        String randomPart = UUID.randomUUID()
                .toString()
                .replace("-", "")
                .substring(0, 8)
                .toUpperCase(Locale.ROOT);

        return "AG-" + randomPart;
    }
}