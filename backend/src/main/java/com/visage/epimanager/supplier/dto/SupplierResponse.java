package com.visage.epimanager.supplier.dto;

import com.visage.epimanager.supplier.persistence.SupplierEntity;
import java.util.UUID;

public record SupplierResponse(
        UUID id,
        String razaoSocial,
        String nomeFantasia,
        String cnpj,
        String email,
        String telefone,
        String contato,
        boolean ativo) {

    public static SupplierResponse from(SupplierEntity entity) {
        return new SupplierResponse(
                entity.getId(), entity.getRazaoSocial(), entity.getNomeFantasia(), entity.getCnpj(),
                entity.getEmail(), entity.getTelefone(), entity.getContato(), entity.isAtivo());
    }
}
