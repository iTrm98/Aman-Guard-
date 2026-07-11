package com.amanguard.backend.feature.fraudanalysis.client;

/**
 * Raised when the AI engine cannot be reached or its response cannot be read.
 * The message never contains the analysed text or the API key. Callers catch
 * this to fall back to rule-based scoring.
 */
public class AiEngineException extends RuntimeException {

    public AiEngineException(String message) {
        super(message);
    }

    public AiEngineException(String message, Throwable cause) {
        super(message, cause);
    }
}
