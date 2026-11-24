package com.visage.epimanager.auth.dto;

import java.util.UUID;

public record AuthenticatedUserResponse(
        UUID userId,
        String name,
        String email,
        UUID companyId,
        String companyProfile) {
}
