package com.visage.epimanager.auth;

import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class AuthRepository {
    private final JdbcTemplate jdbcTemplate;
    private final ObjectMapper objectMapper;

    public AuthRepository(JdbcTemplate jdbcTemplate, ObjectMapper objectMapper) {
        this.jdbcTemplate = jdbcTemplate;
        this.objectMapper = objectMapper;
    }

    public Optional<LoginAccount> findActiveAccountByEmail(String email) {
        List<LoginAccount> results = jdbcTemplate.query(
                """
                SELECT usuario_id, nome, email, senha_hash, papel_global, empresas
                FROM epi_manager.fn_autenticar_usuario(?)
                """,
                (resultSet, rowNum) -> new LoginAccount(
                        resultSet.getObject("usuario_id", UUID.class),
                        resultSet.getString("nome"),
                        resultSet.getString("email"),
                        resultSet.getString("senha_hash"),
                        resultSet.getString("papel_global"),
                        parseCompanies(resultSet.getString("empresas"))),
                email);
        return results.stream().findFirst();
    }

    public Optional<String> findActiveProfile(UUID userId, UUID companyId) {
        List<String> results = jdbcTemplate.query(
                "SELECT epi_manager.fn_perfil_usuario_empresa(?, ?)",
                (resultSet, rowNum) -> resultSet.getString(1),
                userId,
                companyId);
        return results.stream().filter(value -> value != null && !value.isBlank()).findFirst();
    }

    private List<CompanyMembership> parseCompanies(String json) {
        if (json == null || json.isBlank()) {
            return List.of();
        }

        try {
            JsonNode root = objectMapper.readTree(json);
            List<CompanyMembership> memberships = new ArrayList<>();
            for (JsonNode company : root) {
                memberships.add(new CompanyMembership(
                        UUID.fromString(company.path("empresaId").asText()),
                        company.path("razaoSocial").asText(),
                        company.path("nomeFantasia").isNull()
                                ? null
                                : company.path("nomeFantasia").asText(null),
                        company.path("perfil").asText()));
            }
            return List.copyOf(memberships);
        } catch (Exception exception) {
            throw new IllegalStateException("Não foi possível interpretar as empresas vinculadas à conta.", exception);
        }
    }
}
