package com.visage.epimanager.audit;

import java.time.OffsetDateTime;
import java.util.UUID;

public record AuditLogResponse(
        UUID id,
        UUID usuarioId,
        String usuarioNome,
        String acao,
        String entidade,
        UUID registroId,
        String dadosAnteriores,
        String dadosNovos,
        OffsetDateTime createdAt) {
}
