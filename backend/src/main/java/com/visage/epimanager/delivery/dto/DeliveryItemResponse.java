package com.visage.epimanager.delivery.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record DeliveryItemResponse(
        UUID id,
        UUID epiId,
        UUID loteId,
        BigDecimal quantidade,
        LocalDate dataPrevistaSubstituicao,
        String observacao) { }
