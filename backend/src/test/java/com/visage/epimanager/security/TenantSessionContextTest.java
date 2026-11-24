package com.visage.epimanager.security;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import java.util.UUID;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.transaction.support.TransactionSynchronizationManager;

class TenantSessionContextTest {
    private final JdbcTemplate jdbcTemplate = org.mockito.Mockito.mock(JdbcTemplate.class);
    private final TenantSessionContext context = new TenantSessionContext(jdbcTemplate);

    @AfterEach
    void clearTransactionState() {
        TransactionSynchronizationManager.clear();
    }

    @Test
    void refusesToSetTransactionLocalContextWithoutSpringTransaction() {
        assertThrows(IllegalStateException.class,
                () -> context.activate(UUID.randomUUID(), UUID.randomUUID()));
        verifyNoInteractions(jdbcTemplate);
    }

    @Test
    void refusesAccessAfterCompanyMembershipWasRevoked() {
        UUID userId = UUID.randomUUID();
        UUID companyId = UUID.randomUUID();
        TransactionSynchronizationManager.setActualTransactionActive(true);
        when(jdbcTemplate.queryForObject(
                eq("SELECT epi_manager.fn_usuario_pertence_empresa(?, ?)"),
                eq(Boolean.class),
                eq(userId),
                eq(companyId)))
                .thenReturn(false);

        assertThrows(AccessDeniedException.class, () -> context.activate(companyId, userId));
        verify(jdbcTemplate).queryForObject(
                eq("SELECT epi_manager.fn_usuario_pertence_empresa(?, ?)"),
                eq(Boolean.class),
                eq(userId),
                eq(companyId));
    }
}
