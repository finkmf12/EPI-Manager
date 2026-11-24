package com.visage.epimanager.auth;

import java.util.UUID;

public record CompanyMembership(
        UUID companyId,
        String legalName,
        String tradeName,
        String profile) {
    public String displayName() {
        return tradeName == null || tradeName.isBlank() ? legalName : tradeName;
    }
}
