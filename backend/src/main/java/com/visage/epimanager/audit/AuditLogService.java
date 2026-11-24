package com.visage.epimanager.audit;

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
    public AuditLogService(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public void record(
            UUID companyId,
            UUID userId,
            String action,
            String entity,
            UUID recordId,
            Map<String, Object> oldData,
            Map<String, Object> newData) {
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
                toJson(oldData),
                toJson(newData));
    }

    private String toJson(Map<String, Object> values) {
        if (values == null) return null;
        StringBuilder json = new StringBuilder("{");
        boolean first = true;
        for (Map.Entry<String, Object> entry : values.entrySet()) {
            if (!first) json.append(',');
            first = false;
            json.append('"').append(escapeJson(entry.getKey())).append('"').append(':');
            Object value = entry.getValue();
            if (value == null) {
                json.append("null");
            } else if (value instanceof Number || value instanceof Boolean) {
                json.append(value);
            } else {
                json.append('"').append(escapeJson(String.valueOf(value))).append('"');
            }
        }
        return json.append('}').toString();
    }

    private String escapeJson(String value) {
        StringBuilder escaped = new StringBuilder();
        for (int index = 0; index < value.length(); index++) {
            char character = value.charAt(index);
            switch (character) {
                case '"' -> escaped.append("\\\"");
                case '\\' -> escaped.append("\\\\");
                case '\n' -> escaped.append("\\n");
                case '\r' -> escaped.append("\\r");
                case '\t' -> escaped.append("\\t");
                default -> {
                    if (character < 0x20) {
                        escaped.append(String.format("\\u%04x", (int) character));
                    } else {
                        escaped.append(character);
                    }
                }
            }
        }
        return escaped.toString();
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
