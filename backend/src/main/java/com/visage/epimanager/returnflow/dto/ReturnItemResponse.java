package com.visage.epimanager.returnflow.dto;

import java.math.BigDecimal;
import java.util.UUID;

public record ReturnItemResponse(
        UUID id,
        UUID itemEntregaId,
        BigDecimal quantidade,
        String condicao,
        String observacao) { }
