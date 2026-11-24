package com.visage.epimanager.auth;

import com.visage.epimanager.auth.dto.RegisterCompanyRequest;
import com.visage.epimanager.auth.dto.RegisterCompanyResponse;
import com.visage.epimanager.common.CnpjValidator;
import com.visage.epimanager.config.JwtProperties;
import com.visage.epimanager.security.JwtService;
import com.visage.epimanager.security.TenantSessionContext;
import java.nio.charset.StandardCharsets;
import java.util.Locale;
import java.util.UUID;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CompanyRegistrationService {
    private final JdbcTemplate jdbcTemplate;
    private final TenantSessionContext tenantSessionContext;
    private final PasswordEncoder passwordEncoder;
    private final AuthRepository authRepository;
    private final JwtService jwtService;
    private final JwtProperties jwtProperties;

    public CompanyRegistrationService(
            JdbcTemplate jdbcTemplate,
            TenantSessionContext tenantSessionContext,
            PasswordEncoder passwordEncoder,
            AuthRepository authRepository,
            JwtService jwtService,
            JwtProperties jwtProperties) {
        this.jdbcTemplate = jdbcTemplate;
        this.tenantSessionContext = tenantSessionContext;
        this.passwordEncoder = passwordEncoder;
        this.authRepository = authRepository;
        this.jwtService = jwtService;
        this.jwtProperties = jwtProperties;
    }

    @Transactional
    public RegisterCompanyResponse register(RegisterCompanyRequest request) {
        String cnpj = CnpjValidator.normalizeAndValidate(request.cnpj());
        String adminEmail = request.emailAdministrador().trim().toLowerCase(Locale.ROOT);
        if (request.senhaAdministrador().getBytes(StandardCharsets.UTF_8).length > 72) {
            throw new IllegalArgumentException("A senha deve ter no máximo 72 bytes UTF-8.");
        }

        UUID companyId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();
        String tradeName = request.nomeFantasia() == null || request.nomeFantasia().isBlank()
                ? null
                : request.nomeFantasia().trim();
        String contactEmail = request.emailContato() == null || request.emailContato().isBlank()
                ? null
                : request.emailContato().trim().toLowerCase(Locale.ROOT);
        String phone = request.telefone() == null || request.telefone().isBlank()
                ? null
                : request.telefone().trim();

        // The RLS onboarding exception exists only for this transaction and these generated IDs.
        tenantSessionContext.activateOnboarding(companyId, userId);

        jdbcTemplate.update(
                """
                INSERT INTO epi_manager.empresas
                    (id, razao_social, nome_fantasia, cnpj, email_contato, telefone)
                VALUES (?, ?, ?, ?, ?, ?)
                """,
                companyId,
                request.razaoSocial().trim(),
                tradeName,
                cnpj,
                contactEmail,
                phone);

        jdbcTemplate.update(
                """
                INSERT INTO epi_manager.usuarios (id, nome, email, senha_hash)
                VALUES (?, ?, ?, ?)
                """,
                userId,
                request.nomeAdministrador().trim(),
                adminEmail,
                passwordEncoder.encode(request.senhaAdministrador()));

        jdbcTemplate.update(
                """
                INSERT INTO epi_manager.usuarios_empresas (empresa_id, usuario_id, perfil)
                VALUES (?, ?, 'ADMIN')
                """,
                companyId,
                userId);

        String profile = authRepository.findActiveProfile(userId, companyId)
                .orElseThrow(() -> new IllegalStateException("Não foi possível confirmar o vínculo inicial do administrador."));
        String accessToken = jwtService.issueAccessToken(
                userId,
                adminEmail,
                request.nomeAdministrador().trim(),
                companyId,
                profile,
                "USUARIO");

        return new RegisterCompanyResponse(
                companyId,
                tradeName == null ? request.razaoSocial().trim() : tradeName,
                userId,
                adminEmail,
                accessToken,
                "Bearer",
                jwtProperties.accessTtl().toSeconds(),
                profile);
    }
}
