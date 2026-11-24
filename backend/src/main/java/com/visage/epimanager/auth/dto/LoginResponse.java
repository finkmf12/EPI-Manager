package com.visage.epimanager.auth.dto;

import com.visage.epimanager.auth.CompanyMembership;
import java.util.List;
import java.util.UUID;

public record LoginResponse(
        String selectionToken,
        String tokenType,
        long expiresInSeconds,
        UserSummary user,
        List<CompanyMembership> companies) {

    public record UserSummary(UUID id, String name, String email) {
    }
}
