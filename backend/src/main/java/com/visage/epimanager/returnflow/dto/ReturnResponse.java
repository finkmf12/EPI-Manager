package com.visage.epimanager.returnflow.dto;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

public record ReturnResponse(
        UUID id,
        UUID entregaId,
        String status,
        LocalDate dataDevolucao,
        String observacao,
        OffsetDateTime confirmadoEm,
        OffsetDateTime canceladoEm,
        OffsetDateTime createdAt,
        List<ReturnItemResponse> itens) { }
