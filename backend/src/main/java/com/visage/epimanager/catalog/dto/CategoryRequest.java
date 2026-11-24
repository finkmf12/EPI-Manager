package com.visage.epimanager.catalog.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CategoryRequest(
        @NotBlank @Size(max = 120) String nome,
        @Size(max = 2000) String descricao) {
}
