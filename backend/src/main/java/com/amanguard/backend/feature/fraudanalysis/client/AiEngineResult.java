package com.amanguard.backend.feature.fraudanalysis.client;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;

/**
 * Response shape of the Python AI engine's POST /analyze-message
 * (see AI/phishingGPT.py). Arabic-only text fields — reasons/red_flags.
 */
public record AiEngineResult(
        @JsonProperty("is_phishing") boolean isPhishing,
        @JsonProperty("risk_score") int riskScore,
        @JsonProperty("risk_level") String riskLevel,
        @JsonProperty("recommended_action") String recommendedAction,
        @JsonProperty("reasons") List<String> reasons,
        @JsonProperty("red_flags") List<String> redFlags
) {
}
