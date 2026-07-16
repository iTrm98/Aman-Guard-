package com.amanguard.backend.feature.auth.service.impl;

import com.amanguard.backend.feature.auth.model.AuthUser;
import com.amanguard.backend.feature.auth.model.UserRole;
import com.amanguard.backend.feature.auth.service.JwtClaims;
import com.amanguard.backend.feature.auth.service.JwtService;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

@Service
public class JwtServiceImpl implements JwtService {

    private static final String HMAC_ALGORITHM = "HmacSHA256";

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Value("${amanguard.auth.jwt-secret}")
    private String jwtSecret;

    @Value("${amanguard.auth.issuer:AmanGuard}")
    private String issuer;

    @Value("${amanguard.auth.access-token-minutes:30}")
    private long accessTokenMinutes;

    @Value("${amanguard.auth.refresh-token-days:7}")
    private long refreshTokenDays;

    @Override
    public String generateAccessToken(AuthUser user) {
        return generateToken(
                user,
                "ACCESS",
                Duration.ofMinutes(accessTokenMinutes)
        );
    }

    @Override
    public String generateRefreshToken(AuthUser user) {
        return generateToken(
                user,
                "REFRESH",
                Duration.ofDays(refreshTokenDays)
        );
    }

    @Override
    public JwtClaims parseAndValidate(String token) {
        try {
            String[] parts = token.split("\\.");

            if (parts.length != 3) {
                throw new BadCredentialsException("Invalid JWT format");
            }

            String data = parts[0] + "." + parts[1];
            String expectedSignature = sign(data);

            if (!constantTimeEquals(expectedSignature, parts[2])) {
                throw new BadCredentialsException("Invalid JWT signature");
            }

            String payloadJson = new String(
                    base64UrlDecode(parts[1]),
                    StandardCharsets.UTF_8
            );

            Map<String, Object> payload =
                    objectMapper.readValue(
                            payloadJson,
                            new TypeReference<>() {
                            }
                    );

            String tokenIssuer = getString(payload, "iss");

            if (!issuer.equals(tokenIssuer)) {
                throw new BadCredentialsException("Invalid JWT issuer");
            }

            long exp = getLong(payload, "exp");
            Instant expiresAt = Instant.ofEpochSecond(exp);

            if (Instant.now().isAfter(expiresAt)) {
                throw new BadCredentialsException("JWT expired");
            }

            long iat = getLong(payload, "iat");

            return new JwtClaims(
                    getString(payload, "sub"),
                    UserRole.valueOf(getString(payload, "role")),
                    getString(payload, "tokenType"),
                    getString(payload, "jti"),
                    Instant.ofEpochSecond(iat),
                    expiresAt
            );
        } catch (BadCredentialsException exception) {
            throw exception;
        } catch (Exception exception) {
            throw new BadCredentialsException(
                    "Invalid JWT token",
                    exception
            );
        }
    }

    @Override
    public long getAccessTokenSeconds() {
        return Duration
                .ofMinutes(accessTokenMinutes)
                .toSeconds();
    }

    private String generateToken(
            AuthUser user,
            String tokenType,
            Duration duration
    ) {
        try {
            Instant now = Instant.now();
            Instant expiresAt = now.plus(duration);

            Map<String, Object> header = new LinkedHashMap<>();
            header.put("alg", "HS256");
            header.put("typ", "JWT");

            Map<String, Object> payload = new LinkedHashMap<>();
            payload.put("iss", issuer);
            payload.put("sub", user.getNationalId());
            payload.put("role", user.getRole().name());
            payload.put("name", user.getDisplayName());
            payload.put("nameEn", user.getDisplayNameEn() != null
                    ? user.getDisplayNameEn()
                    : user.getDisplayName());
            payload.put("tokenType", tokenType);
            payload.put("jti", UUID.randomUUID().toString());
            payload.put("iat", now.getEpochSecond());
            payload.put("exp", expiresAt.getEpochSecond());

            String encodedHeader = base64UrlEncode(
                    objectMapper.writeValueAsBytes(header)
            );

            String encodedPayload = base64UrlEncode(
                    objectMapper.writeValueAsBytes(payload)
            );

            String data = encodedHeader + "." + encodedPayload;
            String signature = sign(data);

            return data + "." + signature;
        } catch (Exception exception) {
            throw new IllegalStateException(
                    "Failed to generate JWT",
                    exception
            );
        }
    }

    private String sign(String data) {
        try {
            Mac mac = Mac.getInstance(HMAC_ALGORITHM);

            SecretKeySpec keySpec = new SecretKeySpec(
                    jwtSecret.getBytes(StandardCharsets.UTF_8),
                    HMAC_ALGORITHM
            );

            mac.init(keySpec);

            return base64UrlEncode(
                    mac.doFinal(data.getBytes(StandardCharsets.UTF_8))
            );
        } catch (Exception exception) {
            throw new IllegalStateException(
                    "Failed to sign JWT",
                    exception
            );
        }
    }

    private String base64UrlEncode(byte[] bytes) {
        return Base64
                .getUrlEncoder()
                .withoutPadding()
                .encodeToString(bytes);
    }

    private byte[] base64UrlDecode(String value) {
        return Base64
                .getUrlDecoder()
                .decode(value);
    }

    private boolean constantTimeEquals(
            String expected,
            String actual
    ) {
        return MessageDigest.isEqual(
                expected.getBytes(StandardCharsets.UTF_8),
                actual.getBytes(StandardCharsets.UTF_8)
        );
    }

    private String getString(
            Map<String, Object> map,
            String key
    ) {
        Object value = map.get(key);

        if (value == null) {
            throw new BadCredentialsException(
                    "Missing JWT claim: " + key
            );
        }

        return String.valueOf(value);
    }

    private long getLong(
            Map<String, Object> map,
            String key
    ) {
        Object value = map.get(key);

        if (value instanceof Number number) {
            return number.longValue();
        }

        if (value instanceof String text) {
            return Long.parseLong(text);
        }

        throw new BadCredentialsException(
                "Missing numeric JWT claim: " + key
        );
    }
}