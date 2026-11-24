package com.visage.epimanager.company;

import com.visage.epimanager.company.dto.CurrentCompanyResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@Tag(name = "Empresas")
@RequestMapping("/api/v1/companies")
public class CompanyController {
    private final CompanyService companyService;

    public CompanyController(CompanyService companyService) {
        this.companyService = companyService;
    }

    @Operation(summary = "Consultar a empresa ativa no contexto JWT", security = @SecurityRequirement(name = "bearerAuth"))
    @GetMapping("/current")
    public CurrentCompanyResponse currentCompany(@AuthenticationPrincipal Jwt jwt) {
        return companyService.getCurrentCompany(jwt);
    }
}
