package com.visage.epimanager.catalog.dto;

import com.visage.epimanager.catalog.persistence.UnidadeMedida;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record EpiRequest(
        UUID categoriaId,
        @NotBlank @Size(max = 50) String codigo,
        @NotBlank @Size(max = 160) String nome,
        @Size(max = 4000) String descricao,
        @Size(max = 120) String fabricante,
        @Size(max = 120) String modelo,
        @Size(max = 30) String numeroCa,
        LocalDate caValidade,
        @NotNull UnidadeMedida unidadeMedida,
        @NotNull @DecimalMin("0.000") @Digits(integer = 9, fraction = 3) BigDecimal estoqueMinimo,
        @Positive Integer vidaUtilDias) {
}
