package com.visage.epimanager.delivery.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record DeliveryItemRequest(
        @NotNull UUID epiId,
        @NotNull UUID loteId,
        @NotNull @DecimalMin("0.001") @Digits(integer = 9, fraction = 3) BigDecimal quantidade,
        LocalDate dataPrevistaSubstituicao,
        @Size(max = 2000) String observacao) { }
