package com.visage.epimanager.sector.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateSetorRequest(
        @NotBlank @Size(max = 120) String nome,
        @Size(max = 2000) String descricao) {
}
