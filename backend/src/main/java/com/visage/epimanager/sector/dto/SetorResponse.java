package com.visage.epimanager.sector.dto;

import com.visage.epimanager.sector.persistence.SetorEntity;
import java.util.UUID;

public record SetorResponse(UUID id, String nome, String descricao, boolean ativo) {
    public static SetorResponse from(SetorEntity entity) {
        return new SetorResponse(entity.getId(), entity.getNome(), entity.getDescricao(), entity.isAtivo());
    }
}
