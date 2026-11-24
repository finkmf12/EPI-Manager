package com.visage.epimanager.stock.dto;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

public record StockMovementResponse(
        UUID id,
        UUID epiId,
        UUID loteId,
        String epiCodigo,
        String epiNome,
        String codigoLote,
        UUID usuarioId,
        String tipo,
        BigDecimal quantidade,
        String origemTipo,
        UUID origemId,
        String observacao,
        OffsetDateTime createdAt) { }
