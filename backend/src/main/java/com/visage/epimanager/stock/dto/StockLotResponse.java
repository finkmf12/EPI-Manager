package com.visage.epimanager.stock.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

public record StockLotResponse(
        UUID id,
        UUID epiId,
        String epiCodigo,
        String epiNome,
        UUID fornecedorId,
        String fornecedorNome,
        String codigoLote,
        LocalDate dataFabricacao,
        LocalDate dataValidade,
        BigDecimal quantidadeInicial,
        BigDecimal quantidadeDisponivel,
        BigDecimal custoUnitario,
        OffsetDateTime recebidoEm) { }
