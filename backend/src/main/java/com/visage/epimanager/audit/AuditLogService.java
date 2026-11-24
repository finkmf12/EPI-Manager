package com.visage.epimanager.audit;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuditLogService {
    private final JdbcTemplate jdbcTemplate;
    private final ObjectMapper objectMapper;

    public AuditLogService(JdbcTemplate jdbcTemplate, ObjectMapper objectMapper) {
        this.jdbcTemplate = jdbcTemplate;
        this.objectMapper = objectMapper;
    }

    public void record(
            UUID companyId,
            UUID userId,
            String action,
            String entity,
            UUID recordId,
            Map<String, Object> oldData,
            Map<String, Object> newData) {
        try {
            jdbcTemplate.update(
                    """
                    INSERT INTO epi_manager.logs_auditoria
                        (empresa_id, usuario_id, acao, entidade, registro_id,
                         dados_anteriores, dados_novos)
                    VALUES (?, ?, ?, ?, ?, ?::jsonb, ?::jsonb)
                    """,
                    companyId,
                    userId,
                    action,
                    entity,
                    recordId,
                    oldData == null ? null : objectMapper.writeValueAsString(oldData),
                    newData == null ? null : objectMapper.writeValueAsString(newData));
        } catch (JsonProcessingException exception) {
            throw new IllegalStateException("Não foi possível registrar a auditoria da operação.", exception);
        }
    }

    @Transactional(readOnly = true)
    public List<AuditLogResponse> list(UUID companyId, int requestedLimit) {
        int limit = Math.max(1, Math.min(requestedLimit, 200));
        return jdbcTemplate.query(
                """
                SELECT l.id, l.usuario_id, u.nome AS usuario_nome, l.acao,
                       l.entidade, l.registro_id, l.dados_anteriores,
                       l.dados_novos, l.created_at
                FROM epi_manager.logs_auditoria l
                LEFT JOIN epi_manager.usuarios u ON u.id = l.usuario_id
                WHERE l.empresa_id = ?
                ORDER BY l.created_at DESC, l.id DESC
                LIMIT ?
                """,
                (rs, rowNum) -> new AuditLogResponse(
                        rs.getObject("id", UUID.class),
                        rs.getObject("usuario_id", UUID.class),
                        rs.getString("usuario_nome"),
                        rs.getString("acao"),
                        rs.getString("entidade"),
                        rs.getObject("registro_id", UUID.class),
                        rs.getString("dados_anteriores"),
                        rs.getString("dados_novos"),
                        rs.getObject("created_at", OffsetDateTime.class)),
                companyId,
                limit);
    }
}
