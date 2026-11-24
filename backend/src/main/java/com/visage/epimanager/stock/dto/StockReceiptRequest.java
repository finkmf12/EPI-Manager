package com.visage.epimanager.stock.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record StockReceiptRequest(
        @NotNull UUID epiId,
        UUID fornecedorId,
        @NotBlank @Size(max = 80) String codigoLote,
        LocalDate dataFabricacao,
        LocalDate dataValidade,
        @NotNull @DecimalMin("0.001") @Digits(integer = 9, fraction = 3) BigDecimal quantidade,
        @DecimalMin("0.0000") @Digits(integer = 10, fraction = 4) BigDecimal custoUnitario,
        @Size(max = 2000) String observacao) { }
