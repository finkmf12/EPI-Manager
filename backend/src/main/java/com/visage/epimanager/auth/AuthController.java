package com.visage.epimanager.auth;

import com.visage.epimanager.auth.dto.AuthenticatedUserResponse;
import com.visage.epimanager.auth.dto.LoginRequest;
import com.visage.epimanager.auth.dto.LoginResponse;
import com.visage.epimanager.auth.dto.SelectCompanyRequest;
import com.visage.epimanager.auth.dto.SelectCompanyResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@Tag(name = "Autenticação")
@RequestMapping("/api/v1/auth")
public class AuthController {
    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @Operation(summary = "Autenticar por e-mail e senha e listar empresas vinculadas")
    @PostMapping("/login")
    @ResponseStatus(HttpStatus.OK)
    public LoginResponse login(@Valid @RequestBody LoginRequest request) {
        return authService.login(request);
    }

    @Operation(summary = "Selecionar uma empresa e emitir token de acesso", security = @SecurityRequirement(name = "bearerAuth"))
    @PostMapping("/select-company")
    @ResponseStatus(HttpStatus.OK)
    public SelectCompanyResponse selectCompany(
            @AuthenticationPrincipal Jwt selectionJwt,
            @Valid @RequestBody SelectCompanyRequest request) {
        return authService.selectCompany(selectionJwt, request);
    }

    @Operation(summary = "Consultar a identidade e o tenant do token atual", security = @SecurityRequirement(name = "bearerAuth"))
    @GetMapping("/me")
    public AuthenticatedUserResponse currentUser(@AuthenticationPrincipal Jwt jwt) {
        return authService.currentUser(jwt);
    }
}
