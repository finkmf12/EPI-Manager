package com.visage.epimanager.collaborator.dto;

import com.visage.epimanager.collaborator.persistence.ColaboradorEntity;
import java.time.LocalDate;
import java.util.UUID;

public record ColaboradorResponse(
        UUID id,
        UUID setorId,
        String matricula,
        String nome,
        String email,
        String telefone,
        String cargo,
        LocalDate dataAdmissao,
        String status) {
    public static ColaboradorResponse from(ColaboradorEntity entity) {
        return new ColaboradorResponse(
                entity.getId(), entity.getSetorId(), entity.getMatricula(), entity.getNome(),
                entity.getEmail(), entity.getTelefone(), entity.getCargo(),
                entity.getDataAdmissao(), entity.getStatus());
    }
}
