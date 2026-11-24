package com.visage.epimanager.stock;

import com.visage.epimanager.audit.AuditLogService;
import com.visage.epimanager.common.PostgresBusinessRuleTranslator;
import com.visage.epimanager.common.ResourceNotFoundException;
import com.visage.epimanager.security.TenantSessionContext;
import com.visage.epimanager.stock.dto.StockBalanceResponse;
import com.visage.epimanager.stock.dto.StockLotResponse;
import com.visage.epimanager.stock.dto.StockMovementResponse;
import com.visage.epimanager.stock.dto.StockReceiptRequest;
import com.visage.epimanager.stock.dto.StockReceiptResponse;
import java.math.BigDecimal;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.dao.DataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class StockService {
    private final JdbcTemplate jdbcTemplate;
    private final TenantSessionContext tenantSessionContext;
    private final AuditLogService auditLogService;

    public StockService(JdbcTemplate jdbcTemplate, TenantSessionContext tenantSessionContext, AuditLogService auditLogService) {
        this.jdbcTemplate = jdbcTemplate;
        this.tenantSessionContext = tenantSessionContext;
        this.auditLogService = auditLogService;
    }

    @Transactional
    public StockReceiptResponse receive(Jwt jwt, StockReceiptRequest request) {
        Tenant tenant = activateTenant(jwt);
        ensureActiveEpi(tenant.companyId(), request.epiId());
        if (request.fornecedorId() != null) {
            ensureActiveSupplier(tenant.companyId(), request.fornecedorId());
        }

        UUID lotId = UUID.randomUUID();
        UUID movementId = UUID.randomUUID();
        try {
            jdbcTemplate.update(
                    """
                    INSERT INTO epi_manager.lotes_estoque
                        (id, empresa_id, epi_id, fornecedor_id, codigo_lote,
                         data_fabricacao, data_validade, quantidade_inicial,
                         quantidade_disponivel, custo_unitario)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    lotId,
                    tenant.companyId(),
                    request.epiId(),
                    request.fornecedorId(),
                    request.codigoLote().trim(),
                    request.dataFabricacao(),
                    request.dataValidade(),
                    request.quantidade(),
                    request.quantidade(),
                    request.custoUnitario());

            jdbcTemplate.update(
                    """
                    INSERT INTO epi_manager.movimentacoes_estoque
                        (id, empresa_id, epi_id, lote_id, usuario_id, tipo,
                         quantidade, origem_tipo, origem_id, observacao)
                    VALUES (?, ?, ?, ?, ?, 'ENTRADA', ?, 'COMPRA', NULL, ?)
                    """,
                    movementId,
                    tenant.companyId(),
                    request.epiId(),
                    lotId,
                    tenant.userId(),
                    request.quantidade(),
                    normalizeOptional(request.observacao()));
        } catch (DataAccessException exception) {
            throw PostgresBusinessRuleTranslator.translate(exception);
        }

        auditLogService.record(
                tenant.companyId(), tenant.userId(), "ENTRADA_ESTOQUE", "LOTE_ESTOQUE", lotId,
                null,
                Map.of("epiId", request.epiId(), "codigoLote", request.codigoLote().trim(),
                        "quantidade", request.quantidade(), "fornecedorId",
                        request.fornecedorId() == null ? "" : request.fornecedorId().toString()));

        return jdbcTemplate.queryForObject(
                """
                SELECT id, epi_id, codigo_lote, quantidade_inicial,
                       quantidade_disponivel, recebido_em
                FROM epi_manager.lotes_estoque
                WHERE id = ? AND empresa_id = ?
                """,
                (rs, rowNum) -> new StockReceiptResponse(
                        rs.getObject("id", UUID.class),
                        rs.getObject("epi_id", UUID.class),
                        rs.getString("codigo_lote"),
                        rs.getBigDecimal("quantidade_inicial"),
                        rs.getBigDecimal("quantidade_disponivel"),
                        rs.getObject("recebido_em", OffsetDateTime.class)),
                lotId,
                tenant.companyId());
    }

    @Transactional(readOnly = true)
    public List<StockLotResponse> listLots(Jwt jwt, UUID epiId) {
        Tenant tenant = activateTenant(jwt);
        return jdbcTemplate.query(
                """
                SELECT le.id, le.epi_id, e.codigo AS epi_codigo, e.nome AS epi_nome,
                       le.fornecedor_id, COALESCE(f.nome_fantasia, f.razao_social) AS fornecedor_nome,
                       le.codigo_lote, le.data_fabricacao, le.data_validade,
                       le.quantidade_inicial, le.quantidade_disponivel,
                       le.custo_unitario, le.recebido_em
                FROM epi_manager.lotes_estoque le
                JOIN epi_manager.epis e
                  ON e.id = le.epi_id AND e.empresa_id = le.empresa_id
                LEFT JOIN epi_manager.fornecedores f
                  ON f.id = le.fornecedor_id AND f.empresa_id = le.empresa_id
                WHERE le.empresa_id = ?
                  AND (?::uuid IS NULL OR le.epi_id = ?::uuid)
                ORDER BY le.recebido_em DESC, le.codigo_lote
                """,
                (rs, rowNum) -> mapLot(rs),
                tenant.companyId(),
                epiId,
                epiId);
    }

    @Transactional(readOnly = true)
    public List<StockBalanceResponse> listBalances(Jwt jwt) {
        Tenant tenant = activateTenant(jwt);
        return jdbcTemplate.query(
                """
                SELECT e.id AS epi_id, e.codigo, e.nome, e.unidade_medida,
                       e.ativo AS epi_ativo, e.estoque_minimo,
                       COALESCE(SUM(le.quantidade_disponivel) FILTER (
                           WHERE le.data_validade IS NULL OR le.data_validade >= CURRENT_DATE
                       ), 0)::numeric(12,3) AS saldo_disponivel,
                       COALESCE(SUM(le.quantidade_disponivel) FILTER (
                           WHERE le.data_validade < CURRENT_DATE
                       ), 0)::numeric(12,3) AS saldo_vencido
                FROM epi_manager.epis e
                LEFT JOIN epi_manager.lotes_estoque le
                  ON le.epi_id = e.id AND le.empresa_id = e.empresa_id
                WHERE e.empresa_id = ?
                GROUP BY e.id, e.codigo, e.nome, e.unidade_medida, e.ativo, e.estoque_minimo
                ORDER BY e.nome
                """,
                (rs, rowNum) -> {
                    BigDecimal minimum = rs.getBigDecimal("estoque_minimo");
                    BigDecimal available = rs.getBigDecimal("saldo_disponivel");
                    return new StockBalanceResponse(
                            rs.getObject("epi_id", UUID.class),
                            rs.getString("codigo"),
                            rs.getString("nome"),
                            rs.getString("unidade_medida"),
                            rs.getBoolean("epi_ativo"),
                            minimum,
                            available,
                            rs.getBigDecimal("saldo_vencido"),
                            available.compareTo(minimum) < 0);
                },
                tenant.companyId());
    }

    @Transactional(readOnly = true)
    public List<StockMovementResponse> listMovements(Jwt jwt, UUID epiId, int requestedLimit) {
        Tenant tenant = activateTenant(jwt);
        int limit = Math.max(1, Math.min(requestedLimit, 200));
        return jdbcTemplate.query(
                """
                SELECT m.id, m.epi_id, m.lote_id, e.codigo AS epi_codigo,
                       e.nome AS epi_nome, le.codigo_lote, m.usuario_id,
                       m.tipo, m.quantidade, m.origem_tipo, m.origem_id,
                       m.observacao, m.created_at
                FROM epi_manager.movimentacoes_estoque m
                JOIN epi_manager.epis e
                  ON e.id = m.epi_id AND e.empresa_id = m.empresa_id
                JOIN epi_manager.lotes_estoque le
                  ON le.id = m.lote_id AND le.empresa_id = m.empresa_id
                WHERE m.empresa_id = ?
                  AND (?::uuid IS NULL OR m.epi_id = ?::uuid)
                ORDER BY m.created_at DESC, m.id DESC
                LIMIT ?
                """,
                (rs, rowNum) -> mapMovement(rs),
                tenant.companyId(),
                epiId,
                epiId,
                limit);
    }

    private void ensureActiveEpi(UUID companyId, UUID epiId) {
        Boolean active = jdbcTemplate.queryForObject(
                "SELECT EXISTS (SELECT 1 FROM epi_manager.epis WHERE id = ? AND empresa_id = ? AND ativo = TRUE)",
                Boolean.class,
                epiId,
                companyId);
        if (!Boolean.TRUE.equals(active)) {
            throw new ResourceNotFoundException("EPI ativo não encontrado nesta empresa.");
        }
    }

    private void ensureActiveSupplier(UUID companyId, UUID supplierId) {
        Boolean active = jdbcTemplate.queryForObject(
                "SELECT EXISTS (SELECT 1 FROM epi_manager.fornecedores WHERE id = ? AND empresa_id = ? AND ativo = TRUE)",
                Boolean.class,
                supplierId,
                companyId);
        if (!Boolean.TRUE.equals(active)) {
            throw new ResourceNotFoundException("Fornecedor ativo não encontrado nesta empresa.");
        }
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

    private StockLotResponse mapLot(ResultSet rs) throws SQLException {
        return new StockLotResponse(
                rs.getObject("id", UUID.class),
                rs.getObject("epi_id", UUID.class),
                rs.getString("epi_codigo"),
                rs.getString("epi_nome"),
                rs.getObject("fornecedor_id", UUID.class),
                rs.getString("fornecedor_nome"),
                rs.getString("codigo_lote"),
                rs.getObject("data_fabricacao", java.time.LocalDate.class),
                rs.getObject("data_validade", java.time.LocalDate.class),
                rs.getBigDecimal("quantidade_inicial"),
                rs.getBigDecimal("quantidade_disponivel"),
                rs.getBigDecimal("custo_unitario"),
                rs.getObject("recebido_em", OffsetDateTime.class));
    }

    private StockMovementResponse mapMovement(ResultSet rs) throws SQLException {
        return new StockMovementResponse(
                rs.getObject("id", UUID.class),
                rs.getObject("epi_id", UUID.class),
                rs.getObject("lote_id", UUID.class),
                rs.getString("epi_codigo"),
                rs.getString("epi_nome"),
                rs.getString("codigo_lote"),
                rs.getObject("usuario_id", UUID.class),
                rs.getString("tipo"),
                rs.getBigDecimal("quantidade"),
                rs.getString("origem_tipo"),
                rs.getObject("origem_id", UUID.class),
                rs.getString("observacao"),
                rs.getObject("created_at", OffsetDateTime.class));
    }

    private String normalizeOptional(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private record Tenant(UUID companyId, UUID userId) { }
}
