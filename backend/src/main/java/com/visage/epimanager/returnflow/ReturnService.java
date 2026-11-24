package com.visage.epimanager.returnflow;

import com.visage.epimanager.common.ConflictException;
import com.visage.epimanager.common.PostgresBusinessRuleTranslator;
import com.visage.epimanager.common.ResourceNotFoundException;
import com.visage.epimanager.returnflow.dto.ReturnItemRequest;
import com.visage.epimanager.returnflow.dto.ReturnItemResponse;
import com.visage.epimanager.returnflow.dto.ReturnRequest;
import com.visage.epimanager.returnflow.dto.ReturnResponse;
import com.visage.epimanager.security.TenantSessionContext;
import java.time.OffsetDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import org.springframework.dao.DataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ReturnService {
    private final JdbcTemplate jdbcTemplate;
    private final TenantSessionContext tenantSessionContext;

    public ReturnService(JdbcTemplate jdbcTemplate, TenantSessionContext tenantSessionContext) {
        this.jdbcTemplate = jdbcTemplate;
        this.tenantSessionContext = tenantSessionContext;
    }

    @Transactional
    public ReturnResponse create(Jwt jwt, ReturnRequest request) {
        Tenant tenant = activateTenant(jwt);
        ensureConfirmedDelivery(tenant.companyId(), request.entregaId());
        validateItems(tenant.companyId(), request.entregaId(), request.itens());

        UUID returnId = UUID.randomUUID();
        jdbcTemplate.update(
                """
                INSERT INTO epi_manager.devolucoes
                    (id, empresa_id, entrega_id, responsavel_usuario_id,
                     status, data_devolucao, observacao)
                VALUES (?, ?, ?, ?, 'RASCUNHO', COALESCE(?::date, CURRENT_DATE), ?)
                """,
                returnId,
                tenant.companyId(),
                request.entregaId(),
                tenant.userId(),
                request.dataDevolucao(),
                normalizeOptional(request.observacao()));

        try {
            for (ReturnItemRequest item : request.itens()) {
                jdbcTemplate.update(
                        """
                        INSERT INTO epi_manager.itens_devolucao
                            (id, empresa_id, devolucao_id, item_entrega_id,
                             quantidade, condicao, observacao)
                        VALUES (?, ?, ?, ?, ?, ?, ?)
                        """,
                        UUID.randomUUID(),
                        tenant.companyId(),
                        returnId,
                        item.itemEntregaId(),
                        item.quantidade(),
                        item.condicao().name(),
                        normalizeOptional(item.observacao()));
            }
        } catch (DataAccessException exception) {
            throw PostgresBusinessRuleTranslator.translate(exception);
        }

        return getById(tenant.companyId(), returnId);
    }

    @Transactional(readOnly = true)
    public List<ReturnResponse> list(Jwt jwt, int requestedLimit) {
        Tenant tenant = activateTenant(jwt);
        int limit = Math.max(1, Math.min(requestedLimit, 100));
        List<UUID> ids = jdbcTemplate.query(
                """
                SELECT id
                FROM epi_manager.devolucoes
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
    public ReturnResponse findById(Jwt jwt, UUID returnId) {
        Tenant tenant = activateTenant(jwt);
        return getById(tenant.companyId(), returnId);
    }

    @Transactional
    public ReturnResponse confirm(Jwt jwt, UUID returnId) {
        Tenant tenant = activateTenant(jwt);
        ensureDraft(tenant.companyId(), returnId);
        try {
            int updated = jdbcTemplate.update(
                    """
                    UPDATE epi_manager.devolucoes
                    SET status = 'CONFIRMADA'
                    WHERE id = ? AND empresa_id = ? AND status = 'RASCUNHO'
                    """,
                    returnId,
                    tenant.companyId());
            if (updated != 1) {
                throw new ConflictException("A devolução não está mais em RASCUNHO.");
            }
        } catch (DataAccessException exception) {
            throw PostgresBusinessRuleTranslator.translate(exception);
        }
        return getById(tenant.companyId(), returnId);
    }

    @Transactional
    public ReturnResponse cancel(Jwt jwt, UUID returnId) {
        Tenant tenant = activateTenant(jwt);
        ensureDraft(tenant.companyId(), returnId);
        try {
            int updated = jdbcTemplate.update(
                    """
                    UPDATE epi_manager.devolucoes
                    SET status = 'CANCELADA'
                    WHERE id = ? AND empresa_id = ? AND status = 'RASCUNHO'
                    """,
                    returnId,
                    tenant.companyId());
            if (updated != 1) {
                throw new ConflictException("A devolução não está mais em RASCUNHO.");
            }
        } catch (DataAccessException exception) {
            throw PostgresBusinessRuleTranslator.translate(exception);
        }
        return getById(tenant.companyId(), returnId);
    }

    private void ensureConfirmedDelivery(UUID companyId, UUID deliveryId) {
        String status = jdbcTemplate.query(
                "SELECT status FROM epi_manager.entregas WHERE id = ? AND empresa_id = ?",
                (rs, rowNum) -> rs.getString("status"),
                deliveryId,
                companyId).stream().findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("Entrega não encontrada."));
        if (!"CONFIRMADA".equals(status)) {
            throw new ConflictException("A devolução só pode ser criada para uma entrega confirmada.");
        }
    }

    private void validateItems(UUID companyId, UUID deliveryId, List<ReturnItemRequest> items) {
        Set<UUID> deliveredItemIds = new HashSet<>();
        for (ReturnItemRequest item : items) {
            if (!deliveredItemIds.add(item.itemEntregaId())) {
                throw new IllegalArgumentException(
                        "Informe cada item da entrega apenas uma vez na mesma devolução.");
            }
            Boolean belongsToDelivery = jdbcTemplate.queryForObject(
                    """
                    SELECT EXISTS (
                        SELECT 1
                        FROM epi_manager.itens_entrega ie
                        WHERE ie.id = ? AND ie.entrega_id = ? AND ie.empresa_id = ?
                    )
                    """,
                    Boolean.class,
                    item.itemEntregaId(),
                    deliveryId,
                    companyId);
            if (!Boolean.TRUE.equals(belongsToDelivery)) {
                throw new ResourceNotFoundException(
                        "Um dos itens informados não pertence à entrega selecionada.");
            }
        }
    }

    private void ensureDraft(UUID companyId, UUID returnId) {
        String status = jdbcTemplate.query(
                "SELECT status FROM epi_manager.devolucoes WHERE id = ? AND empresa_id = ?",
                (rs, rowNum) -> rs.getString("status"),
                returnId,
                companyId).stream().findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("Devolução não encontrada."));
        if (!"RASCUNHO".equals(status)) {
            throw new ConflictException("Somente devoluções em RASCUNHO podem ser confirmadas ou canceladas.");
        }
    }

    private ReturnResponse getById(UUID companyId, UUID returnId) {
        ReturnHeader header = jdbcTemplate.query(
                """
                SELECT id, entrega_id, status, data_devolucao, observacao,
                       confirmado_em, cancelado_em, created_at
                FROM epi_manager.devolucoes
                WHERE id = ? AND empresa_id = ?
                """,
                (rs, rowNum) -> new ReturnHeader(
                        rs.getObject("id", UUID.class),
                        rs.getObject("entrega_id", UUID.class),
                        rs.getString("status"),
                        rs.getObject("data_devolucao", java.time.LocalDate.class),
                        rs.getString("observacao"),
                        rs.getObject("confirmado_em", OffsetDateTime.class),
                        rs.getObject("cancelado_em", OffsetDateTime.class),
                        rs.getObject("created_at", OffsetDateTime.class)),
                returnId,
                companyId).stream().findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("Devolução não encontrada."));

        List<ReturnItemResponse> items = jdbcTemplate.query(
                """
                SELECT id, item_entrega_id, quantidade, condicao, observacao
                FROM epi_manager.itens_devolucao
                WHERE devolucao_id = ? AND empresa_id = ?
                ORDER BY created_at, id
                """,
                (rs, rowNum) -> new ReturnItemResponse(
                        rs.getObject("id", UUID.class),
                        rs.getObject("item_entrega_id", UUID.class),
                        rs.getBigDecimal("quantidade"),
                        rs.getString("condicao"),
                        rs.getString("observacao")),
                returnId,
                companyId);

        return new ReturnResponse(
                header.id(), header.entregaId(), header.status(), header.dataDevolucao(),
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

    private record ReturnHeader(
            UUID id,
            UUID entregaId,
            String status,
            java.time.LocalDate dataDevolucao,
            String observacao,
            OffsetDateTime confirmadoEm,
            OffsetDateTime canceladoEm,
            OffsetDateTime createdAt) { }
}
