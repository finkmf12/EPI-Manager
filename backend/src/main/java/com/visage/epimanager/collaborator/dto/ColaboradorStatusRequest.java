package com.visage.epimanager.collaborator.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record ColaboradorStatusRequest(
        @NotBlank @Pattern(regexp = "ATIVO|INATIVO|AFASTADO") String status) {
}
