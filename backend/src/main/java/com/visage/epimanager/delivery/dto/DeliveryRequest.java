package com.visage.epimanager.delivery.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record DeliveryRequest(
        @NotNull UUID colaboradorId,
        LocalDate dataEntrega,
        @Size(max = 2000) String observacao,
        @NotEmpty @Size(max = 100) List<@Valid DeliveryItemRequest> itens) { }
