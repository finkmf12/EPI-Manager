package com.visage.epimanager.collaborator.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;
import java.util.UUID;

public record CreateColaboradorRequest(
        UUID setorId,
        @NotBlank @Size(max = 40) String matricula,
        @NotBlank @Size(max = 160) String nome,
        @Email @Size(max = 254) String email,
        @Size(max = 30) String telefone,
        @Size(max = 120) String cargo,
        LocalDate dataAdmissao) {
}
