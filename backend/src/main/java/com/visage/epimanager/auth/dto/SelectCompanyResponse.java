package com.visage.epimanager.auth.dto;

import java.util.UUID;

public record SelectCompanyResponse(
        String accessToken,
        String tokenType,
        long expiresInSeconds,
        UUID companyId,
        String companyProfile) {
}
