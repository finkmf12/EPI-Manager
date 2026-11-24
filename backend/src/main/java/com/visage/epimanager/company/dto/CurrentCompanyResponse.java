package com.visage.epimanager.company.dto;

import java.util.UUID;

public record CurrentCompanyResponse(
        UUID id,
        String legalName,
        String tradeName,
        String cnpj,
        String contactEmail,
        String phone,
        String status) {
}
