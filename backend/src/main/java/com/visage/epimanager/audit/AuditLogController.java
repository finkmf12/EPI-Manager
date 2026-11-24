package com.visage.epimanager.audit;

import com.visage.epimanager.security.TenantSessionContext;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.List;
import java.util.UUID;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.transaction.annotation.Transactional;

@RestController
@Tag(name = "Auditoria")
@SecurityRequirement(name = "bearerAuth")
@RequestMapping("/api/v1/audit-logs")
public class AuditLogController {
    private final AuditLogService service;
    private final TenantSessionContext tenantSessionContext;

    public AuditLogController(AuditLogService service, TenantSessionContext tenantSessionContext) {
        this.service = service;
        this.tenantSessionContext = tenantSessionContext;
    }

    @GetMapping
    @Transactional(readOnly = true)
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Consultar histórico de auditoria da empresa atual")
    public List<AuditLogResponse> list(
            @AuthenticationPrincipal Jwt jwt,
            @RequestParam(defaultValue = "100") int limit) {
        if (jwt == null || !"ACCESS".equals(jwt.getClaimAsString("token_type"))) {
            throw new AccessDeniedException("É necessário um token de acesso válido.");
        }
        try {
            UUID companyId = UUID.fromString(jwt.getClaimAsString("tenant_id"));
            UUID userId = UUID.fromString(jwt.getSubject());
            tenantSessionContext.activate(companyId, userId);
            return service.list(companyId, limit);
        } catch (IllegalArgumentException exception) {
            throw new AccessDeniedException("O token não contém um contexto de empresa válido.");
        }
    }
}
