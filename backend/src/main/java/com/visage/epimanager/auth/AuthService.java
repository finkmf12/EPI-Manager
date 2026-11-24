package com.visage.epimanager.auth;

import com.visage.epimanager.auth.dto.AuthenticatedUserResponse;
import com.visage.epimanager.auth.dto.LoginRequest;
import com.visage.epimanager.auth.dto.LoginResponse;
import com.visage.epimanager.auth.dto.SelectCompanyRequest;
import com.visage.epimanager.auth.dto.SelectCompanyResponse;
import com.visage.epimanager.config.JwtProperties;
import com.visage.epimanager.security.JwtService;
import java.nio.charset.StandardCharsets;
import java.util.Locale;
import java.util.UUID;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {
    private final AuthRepository authRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final JwtProperties jwtProperties;
    private final String dummyPasswordHash;

    public AuthService(
            AuthRepository authRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService,
            JwtProperties jwtProperties) {
        this.authRepository = authRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.jwtProperties = jwtProperties;
        this.dummyPasswordHash = passwordEncoder.encode(UUID.randomUUID().toString());
    }

    @Transactional(readOnly = true)
    public LoginResponse login(LoginRequest request) {
        if (request.password().getBytes(StandardCharsets.UTF_8).length > 72) {
            throw new BadCredentialsException("Email ou senha inválidos.");
        }

        String normalizedEmail = request.email().trim().toLowerCase(Locale.ROOT);
        LoginAccount account = authRepository.findActiveAccountByEmail(normalizedEmail).orElse(null);
        String hashToVerify = account == null ? dummyPasswordHash : account.passwordHash();
        boolean passwordMatches = passwordEncoder.matches(request.password(), hashToVerify);

        if (account == null || !passwordMatches || account.companies().isEmpty()) {
            throw new BadCredentialsException("Email ou senha inválidos.");
        }

        String selectionToken = jwtService.issueCompanySelectionToken(account);
        return new LoginResponse(
                selectionToken,
                "Bearer",
                jwtProperties.selectionTtl().toSeconds(),
                new LoginResponse.UserSummary(account.userId(), account.name(), account.email()),
                account.companies());
    }

    @Transactional(readOnly = true)
    public SelectCompanyResponse selectCompany(Jwt selectionJwt, SelectCompanyRequest request) {
        if (!"COMPANY_SELECTION".equals(selectionJwt.getClaimAsString("token_type"))) {
            throw new AccessDeniedException("Token inválido para seleção de empresa.");
        }

        UUID userId = UUID.fromString(selectionJwt.getSubject());
        UUID companyId = request.companyId();
        String profile = authRepository.findActiveProfile(userId, companyId)
                .orElseThrow(() -> new AccessDeniedException("O usuário não possui vínculo ativo com esta empresa."));

        String accessToken = jwtService.issueAccessToken(
                userId,
                selectionJwt.getClaimAsString("email"),
                selectionJwt.getClaimAsString("name"),
                companyId,
                profile,
                selectionJwt.getClaimAsString("global_role"));

        return new SelectCompanyResponse(
                accessToken,
                "Bearer",
                jwtProperties.accessTtl().toSeconds(),
                companyId,
                profile);
    }

    public AuthenticatedUserResponse currentUser(Jwt jwt) {
        if (!"ACCESS".equals(jwt.getClaimAsString("token_type"))) {
            throw new AccessDeniedException("É necessário um token de acesso válido.");
        }
        return new AuthenticatedUserResponse(
                UUID.fromString(jwt.getSubject()),
                jwt.getClaimAsString("name"),
                jwt.getClaimAsString("email"),
                UUID.fromString(jwt.getClaimAsString("tenant_id")),
                jwt.getClaimAsString("company_profile"));
    }
}
