package com.visage.epimanager.returnflow;

import com.visage.epimanager.returnflow.dto.ReturnRequest;
import com.visage.epimanager.returnflow.dto.ReturnResponse;
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
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@Tag(name = "Devoluções de EPI")
@SecurityRequirement(name = "bearerAuth")
@RequestMapping("/api/v1/returns")
public class ReturnController {
    private final ReturnService service;

    public ReturnController(ReturnService service) {
        this.service = service;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'ALMOXARIFE', 'CONSULTA')")
    @Operation(summary = "Listar devoluções da empresa atual")
    public List<ReturnResponse> list(
            @AuthenticationPrincipal Jwt jwt,
            @RequestParam(defaultValue = "50") int limit) {
        return service.list(jwt, limit);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'ALMOXARIFE', 'CONSULTA')")
    @Operation(summary = "Consultar devolução e seus itens")
    public ReturnResponse findById(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID id) {
        return service.findById(jwt, id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('ADMIN', 'ALMOXARIFE')")
    @Operation(summary = "Criar devolução em rascunho vinculada a entrega confirmada")
    public ReturnResponse create(
            @AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody ReturnRequest request) {
        return service.create(jwt, request);
    }

    @PostMapping("/{id}/confirm")
    @PreAuthorize("hasAnyRole('ADMIN', 'ALMOXARIFE')")
    @Operation(summary = "Confirmar devolução e retornar somente itens reutilizáveis ao estoque")
    public ReturnResponse confirm(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID id) {
        return service.confirm(jwt, id);
    }

    @PostMapping("/{id}/cancel")
    @PreAuthorize("hasAnyRole('ADMIN', 'ALMOXARIFE')")
    @Operation(summary = "Cancelar devolução ainda em rascunho")
    public ReturnResponse cancel(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID id) {
        return service.cancel(jwt, id);
    }
}
