package com.visage.epimanager.stock;

import com.visage.epimanager.stock.dto.StockBalanceResponse;
import com.visage.epimanager.stock.dto.StockLotResponse;
import com.visage.epimanager.stock.dto.StockMovementResponse;
import com.visage.epimanager.stock.dto.StockReceiptRequest;
import com.visage.epimanager.stock.dto.StockReceiptResponse;
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
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@Tag(name = "Estoque")
@SecurityRequirement(name = "bearerAuth")
@RequestMapping("/api/v1/stock")
public class StockController {
    private final StockService service;

    public StockController(StockService service) {
        this.service = service;
    }

    @PostMapping("/receipts")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('ADMIN', 'ALMOXARIFE')")
    @Operation(summary = "Registrar recebimento, criar lote e lançar entrada no estoque")
    public StockReceiptResponse receive(
            @AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody StockReceiptRequest request) {
        return service.receive(jwt, request);
    }

    @GetMapping("/lots")
    @PreAuthorize("hasAnyRole('ADMIN', 'ALMOXARIFE', 'CONSULTA')")
    @Operation(summary = "Consultar lotes de estoque da empresa atual")
    public List<StockLotResponse> lots(
            @AuthenticationPrincipal Jwt jwt,
            @RequestParam(required = false) UUID epiId) {
        return service.listLots(jwt, epiId);
    }

    @GetMapping("/balances")
    @PreAuthorize("hasAnyRole('ADMIN', 'ALMOXARIFE', 'CONSULTA')")
    @Operation(summary = "Consultar saldo disponível e saldo vencido por EPI")
    public List<StockBalanceResponse> balances(@AuthenticationPrincipal Jwt jwt) {
        return service.listBalances(jwt);
    }

    @GetMapping("/movements")
    @PreAuthorize("hasAnyRole('ADMIN', 'ALMOXARIFE', 'CONSULTA')")
    @Operation(summary = "Consultar histórico imutável de movimentações de estoque")
    public List<StockMovementResponse> movements(
            @AuthenticationPrincipal Jwt jwt,
            @RequestParam(required = false) UUID epiId,
            @RequestParam(defaultValue = "50") int limit) {
        return service.listMovements(jwt, epiId, limit);
    }
}
