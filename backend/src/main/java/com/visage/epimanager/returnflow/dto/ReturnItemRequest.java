package com.visage.epimanager.returnflow.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.util.UUID;

public record ReturnItemRequest(
        @NotNull UUID itemEntregaId,
        @NotNull @DecimalMin("0.001") @Digits(integer = 9, fraction = 3) BigDecimal quantidade,
        @NotNull Condition condicao,
        @Size(max = 2000) String observacao) {
    public enum Condition { REUTILIZAVEL, DANIFICADO, DESCARTE }
}
