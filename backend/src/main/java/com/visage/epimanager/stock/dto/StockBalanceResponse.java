package com.visage.epimanager.stock.dto;

import java.math.BigDecimal;
import java.util.UUID;

public record StockBalanceResponse(
        UUID epiId,
        String codigo,
        String nome,
        String unidadeMedida,
        boolean epiAtivo,
        BigDecimal estoqueMinimo,
        BigDecimal saldoDisponivel,
        BigDecimal saldoVencido,
        boolean abaixoDoMinimo) { }
