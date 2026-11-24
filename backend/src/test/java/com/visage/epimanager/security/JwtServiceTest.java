package com.visage.epimanager.security;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

import com.nimbusds.jose.jwk.source.ImmutableSecret;
import com.visage.epimanager.auth.LoginAccount;
import com.visage.epimanager.config.JwtProperties;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.Base64;
import java.util.List;
import java.util.UUID;
import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtEncoder;

class JwtServiceTest {
    private static final Instant FIXED_NOW = Instant.now().truncatedTo(java.time.temporal.ChronoUnit.SECONDS);
    private JwtService jwtService;
    private JwtDecoder jwtDecoder;

    @BeforeEach
    void setUp() {
        byte[] keyBytes = new byte[48];
        for (int index = 0; index < keyBytes.length; index++) {
            keyBytes[index] = (byte) (index + 1);
        }
        SecretKey key = new SecretKeySpec(keyBytes, "HmacSHA256");
        JwtProperties properties = new JwtProperties(
                "epi-manager-test",
                Base64.getEncoder().encodeToString(keyBytes),
                Duration.ofMinutes(15),
                Duration.ofMinutes(3));
        JwtEncoder encoder = new NimbusJwtEncoder(new ImmutableSecret<>(key));
        this.jwtDecoder = NimbusJwtDecoder.withSecretKey(key)
                .macAlgorithm(MacAlgorithm.HS256)
                .build();
        this.jwtService = new JwtService(
                encoder,
                properties,
                Clock.fixed(FIXED_NOW, ZoneOffset.UTC));
    }

    @Test
    void companySelectionTokenDoesNotCarryTenantContext() {
        UUID userId = UUID.randomUUID();
        LoginAccount account = new LoginAccount(
                userId,
                "Usuário de Teste",
                "teste@example.invalid",
                "{bcrypt}not-used-in-this-test",
                "USUARIO",
                List.of());

        var decoded = jwtDecoder.decode(jwtService.issueCompanySelectionToken(account));

        assertEquals("COMPANY_SELECTION", decoded.getClaimAsString("token_type"));
        assertEquals(userId.toString(), decoded.getSubject());
        assertNull(decoded.getClaim("tenant_id"));
        assertEquals(FIXED_NOW.plus(Duration.ofMinutes(3)), decoded.getExpiresAt());
    }

    @Test
    void accessTokenContainsVerifiedTenantAndCompanyProfile() {
        UUID userId = UUID.randomUUID();
        UUID companyId = UUID.randomUUID();

        var decoded = jwtDecoder.decode(jwtService.issueAccessToken(
                userId,
                "teste@example.invalid",
                "Usuário de Teste",
                companyId,
                "ADMIN",
                "USUARIO"));

        assertEquals("ACCESS", decoded.getClaimAsString("token_type"));
        assertEquals(userId.toString(), decoded.getSubject());
        assertEquals(companyId.toString(), decoded.getClaimAsString("tenant_id"));
        assertEquals("ADMIN", decoded.getClaimAsString("company_profile"));
        assertEquals(FIXED_NOW.plus(Duration.ofMinutes(15)), decoded.getExpiresAt());
    }
}
