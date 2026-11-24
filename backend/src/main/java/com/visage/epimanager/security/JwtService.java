package com.visage.epimanager.security;

import com.visage.epimanager.auth.LoginAccount;
import com.visage.epimanager.config.JwtProperties;
import java.time.Clock;
import java.time.Instant;
import java.util.UUID;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.stereotype.Service;

@Service
public class JwtService {
    private final JwtEncoder encoder;
    private final JwtProperties properties;
    private final Clock clock;

    public JwtService(JwtEncoder encoder, JwtProperties properties, Clock clock) {
        this.encoder = encoder;
        this.properties = properties;
        this.clock = clock;
    }

    public String issueCompanySelectionToken(LoginAccount account) {
        return encode(
                account.userId(),
                account.email(),
                account.name(),
                "COMPANY_SELECTION",
                null,
                null,
                account.globalRole(),
                properties.selectionTtl());
    }

    public String issueAccessToken(
            UUID userId,
            String email,
            String name,
            UUID companyId,
            String companyProfile,
            String globalRole) {
        return encode(
                userId,
                email,
                name,
                "ACCESS",
                companyId,
                companyProfile,
                globalRole,
                properties.accessTtl());
    }

    private String encode(
            UUID userId,
            String email,
            String name,
            String tokenType,
            UUID companyId,
            String companyProfile,
            String globalRole,
            java.time.Duration ttl) {
        Instant now = clock.instant();
        JwtClaimsSet.Builder claims = JwtClaimsSet.builder()
                .issuer(properties.issuer())
                .issuedAt(now)
                .expiresAt(now.plus(ttl))
                .subject(userId.toString())
                .claim("token_type", tokenType)
                .claim("email", email)
                .claim("name", name)
                .claim("global_role", globalRole);

        if (companyId != null) {
            claims.claim("tenant_id", companyId.toString())
                    .claim("company_profile", companyProfile);
        }

        return encoder.encode(JwtEncoderParameters.from(
                JwsHeader.with(MacAlgorithm.HS256).build(), claims.build())).getTokenValue();
    }
}
