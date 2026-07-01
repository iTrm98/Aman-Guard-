package com.amanguard.backend.feature.verification.service.impl;

import com.amanguard.backend.common.exception.BadRequestException;
import com.amanguard.backend.common.exception.ResourceNotFoundException;
import com.amanguard.backend.feature.fraudanalysis.model.FraudCase;
import com.amanguard.backend.feature.fraudanalysis.model.RiskLevel;
import com.amanguard.backend.feature.fraudanalysis.repository.FraudCaseRepository;
import com.amanguard.backend.feature.verification.dto.request.EvaluateVerificationRequest;
import com.amanguard.backend.feature.verification.dto.request.VerificationAnswerRequest;
import com.amanguard.backend.feature.verification.dto.response.EvaluateVerificationResponse;
import com.amanguard.backend.feature.verification.model.VerificationSession;
import com.amanguard.backend.feature.verification.repository.VerificationSessionRepository;
import com.amanguard.backend.feature.verification.service.VerificationService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

@Service
public class VerificationServiceImpl
        implements VerificationService {

    private static final int MAX_RISK_SCORE = 100;

    private static final String QUESTION_ONE = "q1";
    private static final String QUESTION_TWO = "q2";
    private static final String QUESTION_THREE = "q3";

    private static final Set<String> REQUIRED_QUESTION_IDS =
            Set.of(
                    QUESTION_ONE,
                    QUESTION_TWO,
                    QUESTION_THREE
            );

    private final VerificationSessionRepository
            verificationSessionRepository;

    private final FraudCaseRepository fraudCaseRepository;

    public VerificationServiceImpl(
            VerificationSessionRepository
                    verificationSessionRepository,
            FraudCaseRepository fraudCaseRepository
    ) {
        this.verificationSessionRepository =
                verificationSessionRepository;

        this.fraudCaseRepository =
                fraudCaseRepository;
    }

    @Override
    @Transactional
    public EvaluateVerificationResponse evaluate(
            EvaluateVerificationRequest request
    ) {
        FraudCase fraudCase = fraudCaseRepository
                .findById(request.caseId())
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "حالة الاحتيال غير موجودة: "
                                        + request.caseId()
                        )
                );

        Optional<VerificationSession> existingSession =
                verificationSessionRepository
                        .findByFraudCaseId(request.caseId());

        if (existingSession.isPresent()) {
            return createExistingResponse(
                    existingSession.get()
            );
        }

        Map<String, Boolean> answers =
                createAnswerMap(request);

        boolean questionOneAnswer =
                answers.get(QUESTION_ONE);

        boolean questionTwoAnswer =
                answers.get(QUESTION_TWO);

        boolean questionThreeAnswer =
                answers.get(QUESTION_THREE);

        int previousRiskScore =
                fraudCase.getRiskScore();

        int addedRiskScore = calculateAddedRiskScore(
                questionOneAnswer,
                questionTwoAnswer,
                questionThreeAnswer
        );

        int finalRiskScore = Math.min(
                previousRiskScore + addedRiskScore,
                MAX_RISK_SCORE
        );

        RiskLevel finalRiskLevel =
                RiskLevel.fromScore(finalRiskScore);

        String recommendedAction =
                createRecommendedAction(finalRiskLevel);

        String recommendation =
                createRecommendation(finalRiskLevel);

        fraudCase.updateRiskAssessment(
                finalRiskScore,
                finalRiskLevel,
                recommendation
        );

        fraudCaseRepository.save(fraudCase);

        VerificationSession session =
                new VerificationSession(
                        fraudCase.getId(),
                        questionOneAnswer,
                        questionTwoAnswer,
                        questionThreeAnswer,
                        previousRiskScore,
                        addedRiskScore,
                        finalRiskScore,
                        finalRiskLevel,
                        recommendedAction
                );

        VerificationSession savedSession =
                verificationSessionRepository.save(session);

        return new EvaluateVerificationResponse(
                savedSession.getId(),
                fraudCase.getId(),
                previousRiskScore,
                addedRiskScore,
                finalRiskScore,
                finalRiskLevel.name()
                        .toLowerCase(Locale.ROOT),
                createRiskLabel(finalRiskLevel),
                recommendedAction,
                createMessage(finalRiskLevel)
        );
    }

    private Map<String, Boolean> createAnswerMap(
            EvaluateVerificationRequest request
    ) {
        Map<String, Boolean> answers = new HashMap<>();

        for (VerificationAnswerRequest answer :
                request.answers()) {

            String questionId =
                    answer.questionId()
                            .trim()
                            .toLowerCase(Locale.ROOT);

            if (!REQUIRED_QUESTION_IDS.contains(questionId)) {
                throw new BadRequestException(
                        "رقم سؤال التحقق غير معروف: "
                                + answer.questionId()
                );
            }

            if (answers.containsKey(questionId)) {
                throw new BadRequestException(
                        "تم إرسال السؤال أكثر من مرة: "
                                + questionId
                );
            }

            answers.put(
                    questionId,
                    Boolean.TRUE.equals(answer.answer())
            );
        }

        if (!answers.keySet()
                .containsAll(REQUIRED_QUESTION_IDS)) {
            throw new BadRequestException(
                    "يجب الإجابة عن أسئلة التحقق الثلاثة"
            );
        }

        return answers;
    }

    private int calculateAddedRiskScore(
            boolean questionOneAnswer,
            boolean questionTwoAnswer,
            boolean questionThreeAnswer
    ) {
        int addedScore = 0;

        if (questionOneAnswer) {
            addedScore += 15;
        }

        if (questionTwoAnswer) {
            addedScore += 25;
        }

        if (questionThreeAnswer) {
            addedScore += 15;
        }

        return addedScore;
    }

    private String createRecommendedAction(
            RiskLevel riskLevel
    ) {
        return switch (riskLevel) {
            case LOW -> "CONTINUE_WITH_CAUTION";
            case MEDIUM -> "VERIFY_BEFORE_PAYMENT";
            case HIGH -> "STOP_AND_CONTACT_BANK";
            case CRITICAL -> "STOP_AND_FREEZE";
        };
    }

    private String createRecommendation(
            RiskLevel riskLevel
    ) {
        return switch (riskLevel) {
            case LOW ->
                    "لم تظهر مؤشرات خطورة مرتفعة، لكن تحقق من الجهة قبل متابعة العملية.";

            case MEDIUM ->
                    "أوقف العملية مؤقتًا وتحقق من هوية الجهة والمستفيد.";

            case HIGH ->
                    "لا تنفذ العملية قبل التواصل مع البنك عبر القنوات الرسمية.";

            case CRITICAL ->
                    "لا تنفذ العملية، وأنهِ التواصل، ولا تشارك رمز التحقق، واستخدم التجميد الطارئ.";
        };
    }

    private String createMessage(
            RiskLevel riskLevel
    ) {
        return switch (riskLevel) {
            case LOW ->
                    "اكتمل التحقق ولم يتم اكتشاف خطر مرتفع.";

            case MEDIUM ->
                    "اكتمل التحقق، وتحتاج العملية إلى مراجعة إضافية.";

            case HIGH ->
                    "اكتمل التحقق وتم اكتشاف خطر مرتفع. تواصل مع البنك.";

            case CRITICAL ->
                    "تم اكتشاف خطر حرج. لا تنفذ العملية واستخدم التجميد الطارئ.";
        };
    }

    private String createRiskLabel(
            RiskLevel riskLevel
    ) {
        return switch (riskLevel) {
            case LOW -> "منخفض (Low)";
            case MEDIUM -> "متوسط (Medium)";
            case HIGH -> "مرتفع (High)";
            case CRITICAL -> "حرج (Critical)";
        };
    }

    private EvaluateVerificationResponse createExistingResponse(
            VerificationSession session
    ) {
        return new EvaluateVerificationResponse(
                session.getId(),
                session.getFraudCaseId(),
                session.getPreviousRiskScore(),
                session.getAddedRiskScore(),
                session.getFinalRiskScore(),
                session.getRiskLevel()
                        .name()
                        .toLowerCase(Locale.ROOT),
                createRiskLabel(session.getRiskLevel()),
                session.getRecommendedAction(),
                "تم تقييم أسئلة التحقق لهذه الحالة مسبقًا."
        );
    }
}