package com.visage.epimanager.sector;

import com.visage.epimanager.sector.dto.CreateSetorRequest;
import com.visage.epimanager.sector.dto.SetorResponse;
import com.visage.epimanager.sector.dto.UpdateSetorRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@Tag(name = "Setores")
@SecurityRequirement(name = "bearerAuth")
@RequestMapping("/api/v1/sectors")
public class SetorController {
    private final SetorService service;

    public SetorController(SetorService service) {
        this.service = service;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'ALMOXARIFE', 'CONSULTA')")
    @Operation(summary = "Listar setores da empresa atual")
    public List<SetorResponse> list(
            @AuthenticationPrincipal Jwt jwt,
            @RequestParam(defaultValue = "false") boolean includeInactive) {
        return service.list(jwt, includeInactive);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'ALMOXARIFE', 'CONSULTA')")
    public SetorResponse findById(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID id) {
        return service.findById(jwt, id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('ADMIN', 'ALMOXARIFE')")
    @Operation(summary = "Criar setor")
    public SetorResponse create(@AuthenticationPrincipal Jwt jwt, @Valid @RequestBody CreateSetorRequest request) {
        return service.create(jwt, request);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'ALMOXARIFE')")
    @Operation(summary = "Atualizar setor")
    public SetorResponse update(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID id,
            @Valid @RequestBody UpdateSetorRequest request) {
        return service.update(jwt, id, request);
    }

    @PatchMapping("/{id}/deactivate")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Inativar setor sem excluir histórico")
    public void deactivate(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID id) {
        service.deactivate(jwt, id);
    }
}
