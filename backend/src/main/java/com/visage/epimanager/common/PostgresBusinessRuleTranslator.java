package com.visage.epimanager.common;

import java.sql.SQLException;
import org.springframework.dao.DataAccessException;

/** Translates explicit PostgreSQL business-rule exceptions (RAISE EXCEPTION) to HTTP 409. */
public final class PostgresBusinessRuleTranslator {
    private PostgresBusinessRuleTranslator() { }

    public static RuntimeException translate(DataAccessException exception) {
        SQLException sqlException = findSqlException(exception);
        if (sqlException != null && "P0001".equals(sqlException.getSQLState())) {
            String message = sqlException.getMessage();
            return new ConflictException(message == null || message.isBlank()
                    ? "A operação viola uma regra de negócio." : message);
        }
        return exception;
    }

    private static SQLException findSqlException(Throwable throwable) {
        Throwable current = throwable;
        while (current != null) {
            if (current instanceof SQLException sqlException) {
                return sqlException;
            }
            current = current.getCause();
        }
        return null;
    }
}
