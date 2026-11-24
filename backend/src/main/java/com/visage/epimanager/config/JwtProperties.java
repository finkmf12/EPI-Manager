package com.visage.epimanager.config;

import java.time.Duration;
import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.security.jwt")
public record JwtProperties(
        String issuer,
        String secretBase64,
        Duration accessTtl,
        Duration selectionTtl) {

    public JwtProperties {
        if (issuer == null || issuer.isBlank()) {
            throw new IllegalStateException("JWT_ISSUER deve ser configurado.");
        }
        if (secretBase64 == null || secretBase64.isBlank()) {
            throw new IllegalStateException("JWT_SECRET_BASE64 deve ser configurado.");
        }
        if (accessTtl == null || accessTtl.isZero() || accessTtl.isNegative()
                || accessTtl.compareTo(Duration.ofMinutes(30)) > 0) {
            throw new IllegalStateException("JWT_ACCESS_TTL deve estar entre 1 segundo e 30 minutos.");
        }
        if (selectionTtl == null || selectionTtl.isZero() || selectionTtl.isNegative()
                || selectionTtl.compareTo(Duration.ofMinutes(5)) > 0) {
            throw new IllegalStateException("JWT_SELECTION_TTL deve estar entre 1 segundo e 5 minutos.");
        }
    }
}
