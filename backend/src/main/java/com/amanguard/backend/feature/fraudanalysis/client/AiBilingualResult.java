package com.amanguard.backend.feature.fraudanalysis.client;

/**
 * Pairs two calls to the AI engine so findings can be shown in both languages.
 *
 * The engine's system prompt is Arabic-only (see AI/phishingGPT.py), so:
 *   - {@code arabic} is the AUTHORITATIVE result — analysed from the clean,
 *     unmodified message; its score / level / red_flags / reasons drive the case.
 *   - {@code english} is BEST-EFFORT — the same message analysed with an English
 *     instruction prepended. If that second call fails (or the engine ignores
 *     the instruction and still answers in Arabic), the caller falls back to the
 *     Arabic text, so English display degrades gracefully, never breaks.
 */
public record AiBilingualResult(
        AiEngineResult arabic,
        AiEngineResult english
) {
}
