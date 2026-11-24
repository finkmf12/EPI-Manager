package com.visage.epimanager.delivery;

import com.visage.epimanager.audit.AuditLogService;
import com.visage.epimanager.common.ConflictException;
import com.visage.epimanager.common.PostgresBusinessRuleTranslator;
import com.visage.epimanager.common.ResourceNotFoundException;
import com.visage.epimanager.delivery.dto.DeliveryItemRequest;
import com.visage.epimanager.delivery.dto.DeliveryItemResponse;
import com.visage.epimanager.delivery.dto.DeliveryRequest;
import com.visage.epimanager.delivery.dto.DeliveryResponse;
import com.visage.epimanager.security.TenantSessionContext;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.OffsetDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import org.springframework.dao.DataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class DeliveryService {
    private final JdbcTemplate jdbcTemplate;
    private final TenantSessionContext tenantSessionContext;
    private final AuditLogService auditLogService;

    public DeliveryService(JdbcTemplate jdbcTemplate, TenantSessionContext tenantSessionContext, AuditLogService auditLogService) {
        this.jdbcTemplate = jdbcTemplate;
        this.tenantSessionContext = tenantSessionContext;
        this.auditLogService = auditLogService;
    }

    @Transactional
    public DeliveryResponse create(Jwt jwt, DeliveryRequest request) {
        Tenant tenant = activateTenant(jwt);
        ensureActiveCollaborator(tenant.companyId(), request.colaboradorId());
        validateItems(tenant.companyId(), request.itens());

        UUID deliveryId = UUID.randomUUID();
        jdbcTemplate.update(
                """
                INSERT INTO epi_manager.entregas
                    (id, empresa_id, colaborador_id, responsavel_usuario_id,
                     status, data_entrega, observacao)
                VALUES (?, ?, ?, ?, 'RASCUNHO', COALESCE(?::date, CURRENT_DATE), ?)
                """,
                deliveryId,
                tenant.companyId(),
                request.colaboradorId(),
                tenant.userId(),
                request.dataEntrega(),
                normalizeOptional(request.observacao()));

        Set<UUID> insertedLots = new HashSet<>();
        try {
            for (DeliveryItemRequest item : request.itens()) {
                if (!insertedLots.add(item.loteId())) {
                    throw new IllegalArgumentException("Informe cada lote apenas uma vez na mesma entrega.");
                }
                jdbcTemplate.update(
                        """
                        INSERT INTO epi_manager.itens_entrega
                            (id, empresa_id, entrega_id, epi_id, lote_id, quantidade,
                             data_prevista_substituicao, observacao)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                        """,
                        UUID.randomUUID(),
                        tenant.companyId(),
                        deliveryId,
                        item.epiId(),
                        item.loteId(),
                        item.quantidade(),
                        item.dataPrevistaSubstituicao(),
                        normalizeOptional(item.observacao()));
            }
        } catch (DataAccessException exception) {
            throw PostgresBusinessRuleTranslator.translate(exception);
        }

        auditLogService.record(tenant.companyId(), tenant.userId(), "CRIAR_RASCUNHO", "ENTREGA", deliveryId,
                null, Map.of("status", "RASCUNHO", "colaboradorId", request.colaboradorId().toString(),
                        "quantidadeItens", request.itens().size()));
        return getById(tenant.companyId(), deliveryId);
    }

    @Transactional(readOnly = true)
    public List<DeliveryResponse> list(Jwt jwt, int requestedLimit) {
        Tenant tenant = activateTenant(jwt);
        int limit = Math.max(1, Math.min(requestedLimit, 100));
        List<UUID> ids = jdbcTemplate.query(
                """
                SELECT id
                FROM epi_manager.entregas
                WHERE empresa_id = ?
                ORDER BY created_at DESC, id DESC
                LIMIT ?
                """,
                (rs, rowNum) -> rs.getObject("id", UUID.class),
                tenant.companyId(),
                limit);
        return ids.stream().map(id -> getById(tenant.companyId(), id)).toList();
    }

    @Transactional(readOnly = true)
    public DeliveryResponse findById(Jwt jwt, UUID deliveryId) {
        Tenant tenant = activateTenant(jwt);
        return getById(tenant.companyId(), deliveryId);
    }

    @Transactional
    public DeliveryResponse confirm(Jwt jwt, UUID deliveryId) {
        Tenant tenant = activateTenant(jwt);
        ensureDraft(tenant.companyId(), deliveryId);
        try {
            int updated = jdbcTemplate.update(
                    """
                    UPDATE epi_manager.entregas
                    SET status = 'CONFIRMADA'
                    WHERE id = ? AND empresa_id = ? AND status = 'RASCUNHO'
                    """,
                    deliveryId,
                    tenant.companyId());
            if (updated != 1) {
                throw new ConflictException("A entrega não está mais em RASCUNHO.");
            }
        } catch (DataAccessException exception) {
            throw PostgresBusinessRuleTranslator.translate(exception);
        }
        auditLogService.record(tenant.companyId(), tenant.userId(), "CONFIRMAR", "ENTREGA", deliveryId,
                Map.of("status", "RASCUNHO"), Map.of("status", "CONFIRMADA"));
        return getById(tenant.companyId(), deliveryId);
    }

    @Transactional
    public DeliveryResponse cancel(Jwt jwt, UUID deliveryId) {
        Tenant tenant = activateTenant(jwt);
        ensureDraft(tenant.companyId(), deliveryId);
        try {
            int updated = jdbcTemplate.update(
                    """
                    UPDATE epi_manager.entregas
                    SET status = 'CANCELADA'
                    WHERE id = ? AND empresa_id = ? AND status = 'RASCUNHO'
                    """,
                    deliveryId,
                    tenant.companyId());
            if (updated != 1) {
                throw new ConflictException("A entrega não está mais em RASCUNHO.");
            }
        } catch (DataAccessException exception) {
            throw PostgresBusinessRuleTranslator.translate(exception);
        }
        auditLogService.record(tenant.companyId(), tenant.userId(), "CANCELAR", "ENTREGA", deliveryId,
                Map.of("status", "RASCUNHO"), Map.of("status", "CANCELADA"));
        return getById(tenant.companyId(), deliveryId);
    }

    private void ensureActiveCollaborator(UUID companyId, UUID collaboratorId) {
        Boolean active = jdbcTemplate.queryForObject(
                """
                SELECT EXISTS (
                    SELECT 1 FROM epi_manager.colaboradores
                    WHERE id = ? AND empresa_id = ? AND status = 'ATIVO'
                )
                """,
                Boolean.class,
                collaboratorId,
                companyId);
        if (!Boolean.TRUE.equals(active)) {
            throw new ResourceNotFoundException("Colaborador ativo não encontrado nesta empresa.");
        }
    }

    private void validateItems(UUID companyId, List<DeliveryItemRequest> items) {
        for (DeliveryItemRequest item : items) {
            Boolean valid = jdbcTemplate.queryForObject(
                    """
                    SELECT EXISTS (
                        SELECT 1
                        FROM epi_manager.epis e
                        JOIN epi_manager.lotes_estoque le
                          ON le.epi_id = e.id AND le.empresa_id = e.empresa_id
                        WHERE e.id = ? AND le.id = ? AND e.empresa_id = ?
                          AND e.ativo = TRUE
                    )
                    """,
                    Boolean.class,
                    item.epiId(),
                    item.loteId(),
                    companyId);
            if (!Boolean.TRUE.equals(valid)) {
                throw new ResourceNotFoundException(
                        "O EPI ou lote informado não pertence a esta empresa ou está inativo.");
            }
        }
    }

    private void ensureDraft(UUID companyId, UUID deliveryId) {
        String status = jdbcTemplate.query(
                "SELECT status FROM epi_manager.entregas WHERE id = ? AND empresa_id = ?",
                (rs, rowNum) -> rs.getString("status"),
                deliveryId,
                companyId).stream().findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("Entrega não encontrada."));
        if (!"RASCUNHO".equals(status)) {
            throw new ConflictException("Somente entregas em RASCUNHO podem ser confirmadas ou canceladas.");
        }
    }

    private DeliveryResponse getById(UUID companyId, UUID deliveryId) {
        DeliveryResponseHeader header = jdbcTemplate.query(
                """
                SELECT id, colaborador_id, status, data_entrega, observacao,
                       confirmado_em, cancelado_em, created_at
                FROM epi_manager.entregas
                WHERE id = ? AND empresa_id = ?
                """,
                (rs, rowNum) -> new DeliveryResponseHeader(
                        rs.getObject("id", UUID.class),
                        rs.getObject("colaborador_id", UUID.class),
                        rs.getString("status"),
                        rs.getObject("data_entrega", java.time.LocalDate.class),
                        rs.getString("observacao"),
                        rs.getObject("confirmado_em", OffsetDateTime.class),
                        rs.getObject("cancelado_em", OffsetDateTime.class),
                        rs.getObject("created_at", OffsetDateTime.class)),
                deliveryId,
                companyId).stream().findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("Entrega não encontrada."));

        List<DeliveryItemResponse> items = jdbcTemplate.query(
                """
                SELECT id, epi_id, lote_id, quantidade, data_prevista_substituicao, observacao
                FROM epi_manager.itens_entrega
                WHERE entrega_id = ? AND empresa_id = ?
                ORDER BY created_at, id
                """,
                (rs, rowNum) -> new DeliveryItemResponse(
                        rs.getObject("id", UUID.class),
                        rs.getObject("epi_id", UUID.class),
                        rs.getObject("lote_id", UUID.class),
                        rs.getBigDecimal("quantidade"),
                        rs.getObject("data_prevista_substituicao", java.time.LocalDate.class),
                        rs.getString("observacao")),
                deliveryId,
                companyId);

        return new DeliveryResponse(
                header.id(), header.colaboradorId(), header.status(), header.dataEntrega(),
                header.observacao(), header.confirmadoEm(), header.canceladoEm(), header.createdAt(), items);
    }

    private Tenant activateTenant(Jwt jwt) {
        if (jwt == null || !"ACCESS".equals(jwt.getClaimAsString("token_type"))) {
            throw new AccessDeniedException("É necessário um token de acesso válido.");
        }
        try {
            UUID companyId = UUID.fromString(jwt.getClaimAsString("tenant_id"));
            UUID userId = UUID.fromString(jwt.getSubject());
            tenantSessionContext.activate(companyId, userId);
            return new Tenant(companyId, userId);
        } catch (IllegalArgumentException exception) {
            throw new AccessDeniedException("O token não contém um contexto de empresa válido.");
        }
    }

    private String normalizeOptional(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private record Tenant(UUID companyId, UUID userId) { }

    private record DeliveryResponseHeader(
            UUID id,
            UUID colaboradorId,
            String status,
            java.time.LocalDate dataEntrega,
            String observacao,
            OffsetDateTime confirmadoEm,
            OffsetDateTime canceladoEm,
            OffsetDateTime createdAt) { }
}
