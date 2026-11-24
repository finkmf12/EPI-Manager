package com.visage.epimanager.common;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertInstanceOf;
import static org.junit.jupiter.api.Assertions.assertSame;

import java.sql.SQLException;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.UncategorizedSQLException;

class PostgresBusinessRuleTranslatorTest {
    @Test
    void translatesExplicitPostgresBusinessRuleToConflict() {
        UncategorizedSQLException databaseException = new UncategorizedSQLException(
                "confirm delivery",
                "UPDATE epi_manager.entregas SET status = 'CONFIRMADA'",
                new SQLException("Estoque insuficiente no lote informado.", "P0001"));

        RuntimeException translated = PostgresBusinessRuleTranslator.translate(databaseException);

        ConflictException conflict = assertInstanceOf(ConflictException.class, translated);
        assertEquals("Estoque insuficiente no lote informado.", conflict.getMessage());
    }

    @Test
    void keepsUnexpectedDatabaseErrorsForOperationalErrorHandling() {
        UncategorizedSQLException databaseException = new UncategorizedSQLException(
                "insert movement",
                "INSERT INTO epi_manager.movimentacoes_estoque",
                new SQLException("Connection failure", "08006"));

        RuntimeException translated = PostgresBusinessRuleTranslator.translate(databaseException);

        assertSame(databaseException, translated);
    }
}
