package com.visage.epimanager.stock.dto;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

public record StockReceiptResponse(
        UUID loteId,
        UUID epiId,
        String codigoLote,
        BigDecimal quantidadeRecebida,
        BigDecimal saldoDisponivel,
        OffsetDateTime recebidoEm) { }
