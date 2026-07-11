package com.amanguard.backend.feature.auth.service.impl;

import com.amanguard.backend.common.exception.BadRequestException;
import com.amanguard.backend.feature.auth.dto.request.LoginRequest;
import com.amanguard.backend.feature.auth.dto.request.OtpRequest;
import com.amanguard.backend.feature.auth.dto.request.RefreshTokenRequest;
import com.amanguard.backend.feature.auth.dto.response.LoginResponse;
import com.amanguard.backend.feature.auth.dto.response.LogoutResponse;
import com.amanguard.backend.feature.auth.dto.response.OtpResponse;
import com.amanguard.backend.feature.auth.model.AuthOtp;
import com.amanguard.backend.feature.auth.model.AuthUser;
import com.amanguard.backend.feature.auth.model.TokenBlacklist;
import com.amanguard.backend.feature.auth.repository.AuthOtpRepository;
import com.amanguard.backend.feature.auth.repository.AuthUserRepository;
import com.amanguard.backend.feature.auth.repository.TokenBlacklistRepository;
import com.amanguard.backend.feature.auth.service.AuthService;
import com.amanguard.backend.feature.auth.service.JwtClaims;
import com.amanguard.backend.feature.auth.service.JwtService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;

@Service
@Transactional
public class AuthServiceImpl implements AuthService {

    private final AuthUserRepository authUserRepository;
    private final AuthOtpRepository authOtpRepository;
    private final TokenBlacklistRepository tokenBlacklistRepository;
    private final JwtService jwtService;
    private final PasswordEncoder passwordEncoder;
    private final SecureRandom secureRandom = new SecureRandom();

    @Value("${amanguard.auth.otp-expiry-minutes:5}")
    private long otpExpiryMinutes;

    @Value("${amanguard.auth.expose-demo-otp:false}")
    private boolean exposeDemoOtp;

    public AuthServiceImpl(
            AuthUserRepository authUserRepository,
            AuthOtpRepository authOtpRepository,
            TokenBlacklistRepository tokenBlacklistRepository,
            JwtService jwtService,
            PasswordEncoder passwordEncoder
    ) {
        this.authUserRepository = authUserRepository;
        this.authOtpRepository = authOtpRepository;
        this.tokenBlacklistRepository = tokenBlacklistRepository;
        this.jwtService = jwtService;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public OtpResponse requestOtp(OtpRequest request) {
        AuthUser user = findUserByIdentifier(request.identifier());

        if (!user.isEnabled()) {
            throw new BadRequestException("هذا المستخدم غير مفعل");
        }

        String otp = generateOtp();

        Instant expiresAt = Instant.now().plus(
                Duration.ofMinutes(otpExpiryMinutes)
        );

        AuthOtp authOtp = new AuthOtp(
                request.identifier(),
                passwordEncoder.encode(otp),
                expiresAt
        );

        authOtpRepository.save(authOtp);

        // TODO: replace with real SMS provider.
        // هنا لاحقًا نربط SMS Gateway لإرسال OTP إلى user.getPhone().

        return new OtpResponse(
                "تم إنشاء رمز التحقق بنجاح",
                expiresAt,
                exposeDemoOtp ? otp : null
        );
    }

    @Override
    public LoginResponse login(LoginRequest request) {
        // Generic message for both unknown id and wrong password so the
        // endpoint doesn't reveal which national ids exist.
        AuthUser user = authUserRepository
                .findByNationalId(request.nationalId())
                .orElseThrow(() ->
                        new BadRequestException(
                                "رقم الهوية أو كلمة المرور غير صحيحة"
                        )
                );

        if (!user.isEnabled()) {
            throw new BadRequestException("هذا المستخدم غير مفعل");
        }

        if (!passwordEncoder.matches(
                request.password(),
                user.getPasswordHash()
        )) {
            throw new BadRequestException(
                    "رقم الهوية أو كلمة المرور غير صحيحة"
            );
        }

        return issueTokens(user);
    }

    @Override
    public LoginResponse refresh(RefreshTokenRequest request) {
        JwtClaims claims = jwtService.parseAndValidate(
                request.refreshToken()
        );

        if (!"REFRESH".equals(claims.tokenType())) {
            throw new BadRequestException("نوع التوكن غير صالح للتحديث");
        }

        AuthUser user = authUserRepository
                .findByNationalId(claims.subject())
                .orElseThrow(() ->
                        new BadRequestException("المستخدم غير موجود")
                );

        String incomingRefreshTokenHash = sha256Hex(
                request.refreshToken()
        );

        if (user.getRefreshTokenHash() == null
                || !user.getRefreshTokenHash().equals(incomingRefreshTokenHash)) {
            throw new BadRequestException("Refresh token غير صالح");
        }

        return issueTokens(user);
    }

    @Override
    public LogoutResponse logout(String authorizationHeader) {
        String accessToken = extractBearerToken(authorizationHeader);

        JwtClaims claims = jwtService.parseAndValidate(accessToken);

        tokenBlacklistRepository.save(
                new TokenBlacklist(
                        claims.jwtId(),
                        claims.expiresAt()
                )
        );

        authUserRepository
                .findByNationalId(claims.subject())
                .ifPresent(user -> {
                    user.setRefreshTokenHash(null);
                    authUserRepository.save(user);
                });

        return new LogoutResponse("تم تسجيل الخروج بنجاح");
    }

    private LoginResponse issueTokens(AuthUser user) {
        String accessToken = jwtService.generateAccessToken(user);
        String refreshToken = jwtService.generateRefreshToken(user);

        user.setRefreshTokenHash(
                sha256Hex(refreshToken)
        );

        authUserRepository.save(user);

        return new LoginResponse(
                accessToken,
                refreshToken,
                user.getRole().name(),
                user.getId(),
                user.getDisplayName(),
                user.getDisplayNameEn()
        );
    }

    private AuthUser findUserByIdentifier(String identifier) {
        return authUserRepository
                .findByNationalIdOrAccountNumber(
                        identifier,
                        identifier
                )
                .orElseThrow(() ->
                        new BadRequestException(
                                "لا يوجد مستخدم بهذا الرقم"
                        )
                );
    }

    private String generateOtp() {
        int number = secureRandom.nextInt(1_000_000);

        return String.format("%06d", number);
    }

    private String extractBearerToken(String authorizationHeader) {
        if (authorizationHeader == null
                || !authorizationHeader.startsWith("Bearer ")) {
            throw new BadRequestException("Authorization Bearer token مطلوب");
        }

        return authorizationHeader.substring(7);
    }

    private String sha256Hex(String value) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");

            byte[] hash = digest.digest(
                    value.getBytes(StandardCharsets.UTF_8)
            );

            StringBuilder hex = new StringBuilder();

            for (byte b : hash) {
                hex.append(String.format("%02x", b));
            }

            return hex.toString();
        } catch (Exception exception) {
            throw new IllegalStateException(
                    "Failed to hash refresh token",
                    exception
            );
        }
    }
}