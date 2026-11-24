package com.visage.epimanager.delivery.dto;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

public record DeliveryResponse(
        UUID id,
        UUID colaboradorId,
        String status,
        LocalDate dataEntrega,
        String observacao,
        OffsetDateTime confirmadoEm,
        OffsetDateTime canceladoEm,
        OffsetDateTime createdAt,
        List<DeliveryItemResponse> itens) { }
