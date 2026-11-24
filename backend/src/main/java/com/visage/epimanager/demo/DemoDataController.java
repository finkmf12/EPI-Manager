package com.visage.epimanager.demo;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.Map;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@Tag(name = "Demonstração")
@SecurityRequirement(name = "bearerAuth")
@RequestMapping("/api/v1/demo")
public class DemoDataController {
    private final DemoDataService service;

    public DemoDataController(DemoDataService service) {
        this.service = service;
    }

    @PostMapping("/seed")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Carregar registros fictícios para apresentação do sistema")
    public Map<String, Object> seed(@AuthenticationPrincipal Jwt jwt) {
        return service.seed(jwt);
    }
}
