package com.visage.epimanager.catalog.dto;

import com.visage.epimanager.catalog.persistence.CategoryEntity;
import java.util.UUID;

public record CategoryResponse(UUID id, String nome, String descricao, boolean ativo) {
    public static CategoryResponse from(CategoryEntity entity) {
        return new CategoryResponse(entity.getId(), entity.getNome(), entity.getDescricao(), entity.isAtivo());
    }
}
