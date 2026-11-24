package com.visage.epimanager.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RegisterCompanyRequest(
        @NotBlank @Size(max = 180) String razaoSocial,
        @Size(max = 180) String nomeFantasia,
        @NotBlank @Size(max = 18) String cnpj,
        @Email @Size(max = 254) String emailContato,
        @Size(max = 30) String telefone,
        @NotBlank @Size(max = 150) String nomeAdministrador,
        @NotBlank @Email @Size(max = 254) String emailAdministrador,
        @NotBlank @Size(min = 12, max = 72) String senhaAdministrador) {
}
