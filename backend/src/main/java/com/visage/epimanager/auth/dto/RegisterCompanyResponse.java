package com.visage.epimanager.auth.dto;

import java.util.UUID;

public record RegisterCompanyResponse(
        UUID companyId,
        String companyName,
        UUID userId,
        String userEmail,
        String accessToken,
        String tokenType,
        long expiresInSeconds,
        String companyProfile) {
}
