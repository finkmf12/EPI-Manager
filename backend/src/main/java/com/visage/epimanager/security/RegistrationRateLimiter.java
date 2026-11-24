package com.visage.epimanager.security;

import com.visage.epimanager.common.RateLimitExceededException;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.stereotype.Component;

/**
 * Per-instance registration throttle. Keep an edge/gateway rate limit in production as well;
 * this in-memory guard is not shared across multiple API replicas.
 */
@Component
public class RegistrationRateLimiter {
    private static final int MAX_ATTEMPTS = 5;
    private static final Duration WINDOW = Duration.ofMinutes(15);
    private final ConcurrentHashMap<String, Window> windows = new ConcurrentHashMap<>();
    private final Clock clock;

    public RegistrationRateLimiter(Clock clock) {
        this.clock = clock;
    }

    public void check(String remoteAddress) {
        String key = remoteAddress == null || remoteAddress.isBlank() ? "unknown" : remoteAddress;
        Instant now = clock.instant();
        Window window = windows.compute(key, (ignored, current) -> {
            if (current == null || !now.isBefore(current.expiresAt())) {
                return new Window(1, now.plus(WINDOW));
            }
            return new Window(current.attempts() + 1, current.expiresAt());
        });

        if (window.attempts() > MAX_ATTEMPTS) {
            throw new RateLimitExceededException("Limite de tentativas de cadastro atingido. Tente novamente mais tarde.");
        }

        if (windows.size() > 10_000) {
            windows.entrySet().removeIf(entry -> !now.isBefore(entry.getValue().expiresAt()));
        }
    }

    private record Window(int attempts, Instant expiresAt) {
    }
}
