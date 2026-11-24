package com.visage.epimanager.auth;

import java.util.List;
import java.util.UUID;

public record LoginAccount(
        UUID userId,
        String name,
        String email,
        String passwordHash,
        String globalRole,
        List<CompanyMembership> companies) {
}
