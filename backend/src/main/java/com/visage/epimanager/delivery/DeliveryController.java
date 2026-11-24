package com.visage.epimanager.delivery;

import com.visage.epimanager.delivery.dto.DeliveryRequest;
import com.visage.epimanager.delivery.dto.DeliveryResponse;
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
@Tag(name = "Entregas de EPI")
@SecurityRequirement(name = "bearerAuth")
@RequestMapping("/api/v1/deliveries")
public class DeliveryController {
    private final DeliveryService service;

    public DeliveryController(DeliveryService service) {
        this.service = service;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'ALMOXARIFE', 'CONSULTA')")
    @Operation(summary = "Listar entregas da empresa atual")
    public List<DeliveryResponse> list(
            @AuthenticationPrincipal Jwt jwt,
            @RequestParam(defaultValue = "50") int limit) {
        return service.list(jwt, limit);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'ALMOXARIFE', 'CONSULTA')")
    @Operation(summary = "Consultar entrega e seus itens")
    public DeliveryResponse findById(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID id) {
        return service.findById(jwt, id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('ADMIN', 'ALMOXARIFE')")
    @Operation(summary = "Criar entrega em rascunho")
    public DeliveryResponse create(
            @AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody DeliveryRequest request) {
        return service.create(jwt, request);
    }

    @PostMapping("/{id}/confirm")
    @PreAuthorize("hasAnyRole('ADMIN', 'ALMOXARIFE')")
    @Operation(summary = "Confirmar entrega e baixar estoque atomicamente")
    public DeliveryResponse confirm(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID id) {
        return service.confirm(jwt, id);
    }

    @PostMapping("/{id}/cancel")
    @PreAuthorize("hasAnyRole('ADMIN', 'ALMOXARIFE')")
    @Operation(summary = "Cancelar entrega ainda em rascunho")
    public DeliveryResponse cancel(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID id) {
        return service.cancel(jwt, id);
    }
}
