package com.amanguard.backend.feature.fraudanalysis.client;

import jakarta.annotation.PreDestroy;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.Map;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;

/**
 * Calls the Python fraud-analysis engine (AI/phishingGPT.py) at
 * POST {engine-url}/analyze-message with {"message_text": ...}.
 *
 * Security: never logs the API key or the analysed message text. The engine is
 * currently keyless; the optional bearer token is sent only when configured
 * (amanguard.ai.api-key non-blank), keeping the client forward-compatible.
 */
@Component
public class AiEngineClient {

    private static final int CONNECT_TIMEOUT_MS = 5000;

    // Hard ceiling on the best-effort English call so a slow engine can't push
    // one /analyze request past its budget (the two calls run in parallel, each
    // already bounded by the RestTemplate read timeout).
    private static final long ENGLISH_CALL_TIMEOUT_MS = 10_000;

    // Prepended to the English call's message_text. The engine's system prompt is
    // Arabic-only, so this is a best-effort nudge — if ignored, the caller falls
    // back to the Arabic text (see analyzeBilingual / AiBilingualResult).
    private static final String ENGLISH_INSTRUCTION =
            "[System note: write the reasons and red_flags in clear English.]\n\n";

    private final String analyzeUrl;
    private final String apiKey;
    private final RestTemplate restTemplate;

    // Small daemon pool so the English call can run alongside the Arabic one.
    private final ExecutorService engineExecutor = Executors.newFixedThreadPool(
            4,
            runnable -> {
                Thread thread = new Thread(runnable, "ai-engine-bilingual");
                thread.setDaemon(true);
                return thread;
            }
    );

    public AiEngineClient(
            @Value("${amanguard.ai.engine-url:http://localhost:8000}") String engineUrl,
            @Value("${amanguard.ai.api-key:}") String apiKey,
            @Value("${amanguard.ai.timeout-ms:8000}") int timeoutMs
    ) {
        this.analyzeUrl = stripTrailingSlash(engineUrl) + "/analyze-message";
        this.apiKey = apiKey;

        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(CONNECT_TIMEOUT_MS);
        factory.setReadTimeout(timeoutMs);
        this.restTemplate = new RestTemplate(factory);
    }

    /** Single-language analysis (Arabic, the engine's native output). */
    public AiEngineResult analyze(String text) {
        return callEngine(text);
    }

    /**
     * Runs two engine calls that overlap in time: the authoritative Arabic call
     * on this thread and a best-effort English call on a worker thread. The
     * Arabic result drives scoring/persistence; the English result only supplies
     * English finding text and degrades to the Arabic text on any failure.
     */
    public AiBilingualResult analyzeBilingual(String text) {
        CompletableFuture<AiEngineResult> englishFuture =
                CompletableFuture.supplyAsync(
                        () -> callEngine(ENGLISH_INSTRUCTION + text),
                        engineExecutor
                );

        AiEngineResult arabic;
        try {
            // Authoritative: a failure here propagates so /analyze falls back to
            // the rule engine, exactly as before bilingual support existed.
            arabic = callEngine(text);
        } catch (RuntimeException failure) {
            englishFuture.cancel(true);
            throw failure;
        }

        AiEngineResult english = resolveEnglish(englishFuture, arabic);
        return new AiBilingualResult(arabic, english);
    }

    // English is optional: return it if it arrives in time, else mirror Arabic.
    private AiEngineResult resolveEnglish(
            CompletableFuture<AiEngineResult> englishFuture,
            AiEngineResult arabicFallback
    ) {
        try {
            return englishFuture.get(ENGLISH_CALL_TIMEOUT_MS, TimeUnit.MILLISECONDS);
        } catch (InterruptedException interrupted) {
            Thread.currentThread().interrupt();
            englishFuture.cancel(true);
            return arabicFallback;
        } catch (Exception failure) {
            englishFuture.cancel(true);
            return arabicFallback;
        }
    }

    private AiEngineResult callEngine(String messageText) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        if (apiKey != null && !apiKey.isBlank()) {
            headers.setBearerAuth(apiKey);
        }

        HttpEntity<Map<String, String>> request =
                new HttpEntity<>(Map.of("message_text", messageText), headers);

        try {
            ResponseEntity<AiEngineResult> response = restTemplate.postForEntity(
                    analyzeUrl,
                    request,
                    AiEngineResult.class
            );

            AiEngineResult body = response.getBody();

            if (body == null) {
                throw new AiEngineException("AI engine returned an empty body");
            }

            return body;
        } catch (AiEngineException exception) {
            throw exception;
        } catch (Exception exception) {
            // Never include the message text or key in the error.
            throw new AiEngineException(
                    "AI engine call failed: " + exception.getClass().getSimpleName(),
                    exception
            );
        }
    }

    @PreDestroy
    void shutdown() {
        engineExecutor.shutdownNow();
    }

    private static String stripTrailingSlash(String url) {
        if (url != null && url.endsWith("/")) {
            return url.substring(0, url.length() - 1);
        }
        return url;
    }
}
