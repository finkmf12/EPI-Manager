package com.visage.epimanager.security;

import java.util.UUID;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Component;
import org.springframework.transaction.support.TransactionSynchronizationManager;

/**
 * Installs transaction-local PostgreSQL context consumed by the tenant RLS policies.
 * Call this only from a method already running inside a Spring-managed transaction.
 */
@Component
public class TenantSessionContext {

    private final JdbcTemplate jdbcTemplate;

    public TenantSessionContext(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public void activate(UUID companyId, UUID userId) {
        configure(companyId, userId, false);
    }

    public void activateOnboarding(UUID companyId, UUID userId) {
        configure(companyId, userId, true);
    }

    private void configure(UUID companyId, UUID userId, boolean onboarding) {
        if (companyId == null || userId == null) {
            throw new IllegalArgumentException("O contexto de empresa e usuário é obrigatório.");
        }
        if (!TransactionSynchronizationManager.isActualTransactionActive()) {
            throw new IllegalStateException(
                    "O contexto multiempresa só pode ser ativado dentro de uma transação Spring.");
        }
        if (!onboarding) {
            Boolean activeMembership = jdbcTemplate.queryForObject(
                    "SELECT epi_manager.fn_usuario_pertence_empresa(?, ?)",
                    Boolean.class,
                    userId,
                    companyId);
            if (!Boolean.TRUE.equals(activeMembership)) {
                throw new AccessDeniedException(
                        "O usuário não possui vínculo ativo com a empresa selecionada.");
            }
        }
        jdbcTemplate.queryForObject(
                """
                SELECT
                  set_config('app.empresa_id', ?, true),
                  set_config('app.usuario_id', ?, true),
                  set_config('app.admin_plataforma', 'false', true),
                  set_config('app.onboarding', ?, true)
                """,
                (resultSet, rowNum) -> Boolean.TRUE,
                companyId.toString(),
                userId.toString(),
                Boolean.toString(onboarding));
    }
}
