package com.visage.epimanager.supplier.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record SupplierRequest(
        @NotBlank @Size(max = 180) String razaoSocial,
        @Size(max = 180) String nomeFantasia,
        @Size(max = 18) String cnpj,
        @Email @Size(max = 254) String email,
        @Size(max = 30) String telefone,
        @Size(max = 120) String contato) {
}
