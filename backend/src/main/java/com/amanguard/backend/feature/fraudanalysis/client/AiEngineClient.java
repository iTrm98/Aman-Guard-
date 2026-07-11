package com.amanguard.backend.feature.fraudanalysis.client;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

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

    private final String analyzeUrl;
    private final String apiKey;
    private final RestTemplate restTemplate;

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

    public AiEngineResult analyze(String text) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        if (apiKey != null && !apiKey.isBlank()) {
            headers.setBearerAuth(apiKey);
        }

        HttpEntity<Map<String, String>> request =
                new HttpEntity<>(Map.of("message_text", text), headers);

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

    private static String stripTrailingSlash(String url) {
        if (url != null && url.endsWith("/")) {
            return url.substring(0, url.length() - 1);
        }
        return url;
    }
}
