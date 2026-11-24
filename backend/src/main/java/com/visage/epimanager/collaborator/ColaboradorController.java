package com.visage.epimanager.collaborator;

import com.visage.epimanager.collaborator.dto.ColaboradorResponse;
import com.visage.epimanager.collaborator.dto.ColaboradorStatusRequest;
import com.visage.epimanager.collaborator.dto.CreateColaboradorRequest;
import com.visage.epimanager.collaborator.dto.UpdateColaboradorRequest;
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
@Tag(name = "Colaboradores")
@SecurityRequirement(name = "bearerAuth")
@RequestMapping("/api/v1/collaborators")
public class ColaboradorController {
    private final ColaboradorService service;

    public ColaboradorController(ColaboradorService service) {
        this.service = service;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'ALMOXARIFE', 'CONSULTA')")
    @Operation(summary = "Listar colaboradores da empresa atual")
    public List<ColaboradorResponse> list(
            @AuthenticationPrincipal Jwt jwt,
            @RequestParam(required = false) String status) {
        return service.list(jwt, status);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'ALMOXARIFE', 'CONSULTA')")
    public ColaboradorResponse findById(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID id) {
        return service.findById(jwt, id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('ADMIN', 'ALMOXARIFE')")
    @Operation(summary = "Cadastrar colaborador")
    public ColaboradorResponse create(
            @AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody CreateColaboradorRequest request) {
        return service.create(jwt, request);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'ALMOXARIFE')")
    @Operation(summary = "Atualizar colaborador")
    public ColaboradorResponse update(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID id,
            @Valid @RequestBody UpdateColaboradorRequest request) {
        return service.update(jwt, id, request);
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Alterar situação do colaborador")
    public ColaboradorResponse changeStatus(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID id,
            @Valid @RequestBody ColaboradorStatusRequest request) {
        return service.changeStatus(jwt, id, request.status());
    }
}
