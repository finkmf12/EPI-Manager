package com.visage.epimanager.catalog.dto;

import com.visage.epimanager.catalog.persistence.EpiEntity;
import com.visage.epimanager.catalog.persistence.UnidadeMedida;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record EpiResponse(
        UUID id,
        UUID categoriaId,
        String codigo,
        String nome,
        String descricao,
        String fabricante,
        String modelo,
        String numeroCa,
        LocalDate caValidade,
        UnidadeMedida unidadeMedida,
        BigDecimal estoqueMinimo,
        Integer vidaUtilDias,
        boolean ativo) {

    public static EpiResponse from(EpiEntity entity) {
        return new EpiResponse(
                entity.getId(), entity.getCategoriaId(), entity.getCodigo(), entity.getNome(),
                entity.getDescricao(), entity.getFabricante(), entity.getModelo(), entity.getNumeroCa(),
                entity.getCaValidade(), entity.getUnidadeMedida(), entity.getEstoqueMinimo(),
                entity.getVidaUtilDias(), entity.isAtivo());
    }
}
