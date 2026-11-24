package com.visage.epimanager.auth.dto;

import jakarta.validation.constraints.NotNull;
import java.util.UUID;

public record SelectCompanyRequest(@NotNull UUID companyId) {
}
