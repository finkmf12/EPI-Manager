package com.visage.epimanager.auth;

import com.visage.epimanager.auth.dto.RegisterCompanyRequest;
import com.visage.epimanager.auth.dto.RegisterCompanyResponse;
import com.visage.epimanager.security.RegistrationRateLimiter;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@Tag(name = "Cadastro")
@RequestMapping("/api/v1/auth")
public class RegistrationController {
    private final CompanyRegistrationService registrationService;
    private final RegistrationRateLimiter rateLimiter;

    public RegistrationController(
            CompanyRegistrationService registrationService,
            RegistrationRateLimiter rateLimiter) {
        this.registrationService = registrationService;
        this.rateLimiter = rateLimiter;
    }

    @Operation(summary = "Cadastrar empresa e criar o primeiro usuário como administrador")
    @PostMapping("/register-company")
    @ResponseStatus(HttpStatus.CREATED)
    public RegisterCompanyResponse registerCompany(
            @Valid @RequestBody RegisterCompanyRequest request,
            HttpServletRequest servletRequest) {
        rateLimiter.check(servletRequest.getRemoteAddr());
        return registrationService.register(request);
    }
}
