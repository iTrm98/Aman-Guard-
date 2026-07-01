package com.amanguard.backend.feature.transactionanalysis.service.impl;

import com.amanguard.backend.feature.fraudanalysis.model.FraudCase;
import com.amanguard.backend.feature.fraudanalysis.model.RiskLevel;
import com.amanguard.backend.feature.fraudanalysis.repository.FraudCaseRepository;
import com.amanguard.backend.feature.transactionanalysis.dto.request.AnalyzeTransactionRequest;
import com.amanguard.backend.feature.transactionanalysis.dto.response.AnalyzeTransactionResponse;
import com.amanguard.backend.feature.transactionanalysis.dto.response.TransactionRiskFindingResponse;
import com.amanguard.backend.feature.transactionanalysis.model.TransactionAnalysis;
import com.amanguard.backend.feature.transactionanalysis.repository.TransactionAnalysisRepository;
import com.amanguard.backend.feature.transactionanalysis.service.TransactionAnalysisService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

@Service
public class TransactionAnalysisServiceImpl
        implements TransactionAnalysisService {

    private static final int MAX_RISK_SCORE = 100;

    private static final BigDecimal MEDIUM_AMOUNT =
            new BigDecimal("5000");

    private static final BigDecimal HIGH_AMOUNT =
            new BigDecimal("10000");

    private final TransactionAnalysisRepository transactionAnalysisRepository;
    private final FraudCaseRepository fraudCaseRepository;

    public TransactionAnalysisServiceImpl(
            TransactionAnalysisRepository transactionAnalysisRepository,
            FraudCaseRepository fraudCaseRepository
    ) {
        this.transactionAnalysisRepository =
                transactionAnalysisRepository;

        this.fraudCaseRepository =
                fraudCaseRepository;
    }

    @Override
    @Transactional
    public AnalyzeTransactionResponse analyze(
            AnalyzeTransactionRequest request
    ) {
        int riskScore = 0;

        List<TransactionRiskFindingResponse> findings =
                new ArrayList<>();

        if (request.newBeneficiary()) {
            riskScore += 20;

            findings.add(new TransactionRiskFindingResponse(
                    "مستفيد جديد",
                    "التحويل إلى مستفيد جديد يحتاج تحققًا إضافيًا."
            ));
        }

        if (request.callerRequestedTransfer()) {
            riskScore += 25;

            findings.add(new TransactionRiskFindingResponse(
                    "طلب التحويل أثناء مكالمة",
                    "وجود شخص يطلب تنفيذ التحويل أثناء المكالمة مؤشر على الهندسة الاجتماعية."
            ));
        }

        if (request.otpRequested()) {
            riskScore += 35;

            findings.add(new TransactionRiskFindingResponse(
                    "طلب رمز OTP",
                    "لا ينبغي مشاركة رمز التحقق مع أي شخص، حتى لو ادعى أنه موظف بنك."
            ));
        }

        if (request.urgentRequest()) {
            riskScore += 15;

            findings.add(new TransactionRiskFindingResponse(
                    "استعجال في تنفيذ العملية",
                    "المحتال قد يستخدم الضغط والاستعجال لمنع العميل من التحقق."
            ));
        }

        if (request.unusualTime()) {
            riskScore += 10;

            findings.add(new TransactionRiskFindingResponse(
                    "وقت عملية غير معتاد",
                    "تم تنفيذ العملية في وقت غير معتاد مقارنة بالسلوك المتوقع."
            ));
        }

        if (request.amount().compareTo(HIGH_AMOUNT) >= 0) {
            riskScore += 20;

            findings.add(new TransactionRiskFindingResponse(
                    "مبلغ تحويل مرتفع",
                    "قيمة التحويل تساوي أو تتجاوز 10,000 ريال."
            ));
        } else if (request.amount().compareTo(MEDIUM_AMOUNT) >= 0) {
            riskScore += 10;

            findings.add(new TransactionRiskFindingResponse(
                    "مبلغ يحتاج تحققًا",
                    "قيمة التحويل تساوي أو تتجاوز 5,000 ريال."
            ));
        }

        riskScore = Math.min(
                riskScore,
                MAX_RISK_SCORE
        );

        RiskLevel riskLevel =
                RiskLevel.fromScore(riskScore);

        if (findings.isEmpty()) {
            findings.add(new TransactionRiskFindingResponse(
                    "لا توجد مؤشرات قوية",
                    "لم يتم اكتشاف مؤشرات خطورة واضحة في بيانات التحويل."
            ));
        }

        String recommendation =
                createRecommendation(riskLevel);

        FraudCase fraudCase = new FraudCase(
                createFraudCaseSummary(request),
                riskScore,
                riskLevel,
                recommendation
        );

        FraudCase savedFraudCase =
                fraudCaseRepository.save(fraudCase);

        TransactionAnalysis transactionAnalysis =
                new TransactionAnalysis(
                        savedFraudCase.getId(),
                        request.amount(),
                        request.newBeneficiary(),
                        request.callerRequestedTransfer(),
                        request.otpRequested(),
                        request.urgentRequest(),
                        request.unusualTime(),
                        riskScore,
                        riskLevel,
                        recommendation
                );

        TransactionAnalysis savedAnalysis =
                transactionAnalysisRepository.save(
                        transactionAnalysis
                );

        return new AnalyzeTransactionResponse(
                savedAnalysis.getId(),
                savedFraudCase.getId(),
                savedAnalysis.getAmount(),
                savedAnalysis.getRiskScore(),
                riskLevel.name()
                        .toLowerCase(Locale.ROOT),
                createRiskLabel(riskLevel),
                findings,
                recommendation,
                riskScore >= 60
        );
    }

    private String createFraudCaseSummary(
            AnalyzeTransactionRequest request
    ) {
        return "تحليل تحويل مالي بقيمة "
                + request.amount()
                + " ريال. "
                + "مستفيد جديد: "
                + yesOrNo(request.newBeneficiary())
                + "، طلب المتصل تنفيذ التحويل: "
                + yesOrNo(request.callerRequestedTransfer())
                + "، طلب OTP: "
                + yesOrNo(request.otpRequested())
                + "، طلب عاجل: "
                + yesOrNo(request.urgentRequest())
                + "، وقت غير معتاد: "
                + yesOrNo(request.unusualTime())
                + ".";
    }

    private String yesOrNo(boolean value) {
        return value ? "نعم" : "لا";
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

    private String createRecommendation(
            RiskLevel riskLevel
    ) {
        return switch (riskLevel) {
            case LOW ->
                    "لم يتم اكتشاف خطر مرتفع، لكن تأكد من بيانات المستفيد قبل التحويل.";

            case MEDIUM ->
                    "راجع بيانات المستفيد وسبب التحويل قبل إكمال العملية.";

            case HIGH ->
                    "أوقف العملية مؤقتًا وتحقق من المستفيد ومن البنك عبر القنوات الرسمية.";

            case CRITICAL ->
                    "لا تنفذ التحويل. أنهِ المكالمة ولا تشارك رمز OTP، وتواصل مع البنك فورًا.";
        };
    }
}