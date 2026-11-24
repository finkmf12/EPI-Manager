package com.visage.epimanager.demo;

import com.visage.epimanager.catalog.CategoryService;
import com.visage.epimanager.catalog.EpiService;
import com.visage.epimanager.catalog.dto.CategoryRequest;
import com.visage.epimanager.catalog.dto.CategoryResponse;
import com.visage.epimanager.catalog.dto.EpiRequest;
import com.visage.epimanager.catalog.dto.EpiResponse;
import com.visage.epimanager.catalog.persistence.UnidadeMedida;
import com.visage.epimanager.collaborator.ColaboradorService;
import com.visage.epimanager.collaborator.dto.ColaboradorResponse;
import com.visage.epimanager.collaborator.dto.CreateColaboradorRequest;
import com.visage.epimanager.delivery.DeliveryService;
import com.visage.epimanager.delivery.dto.DeliveryItemRequest;
import com.visage.epimanager.delivery.dto.DeliveryRequest;
import com.visage.epimanager.delivery.dto.DeliveryResponse;
import com.visage.epimanager.returnflow.ReturnService;
import com.visage.epimanager.returnflow.dto.ReturnItemRequest;
import com.visage.epimanager.returnflow.dto.ReturnRequest;
import com.visage.epimanager.sector.SetorService;
import com.visage.epimanager.sector.dto.CreateSetorRequest;
import com.visage.epimanager.sector.dto.SetorResponse;
import com.visage.epimanager.security.TenantSessionContext;
import com.visage.epimanager.stock.StockService;
import com.visage.epimanager.stock.dto.StockReceiptRequest;
import com.visage.epimanager.stock.dto.StockReceiptResponse;
import com.visage.epimanager.supplier.SupplierService;
import com.visage.epimanager.supplier.dto.SupplierRequest;
import com.visage.epimanager.supplier.dto.SupplierResponse;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class DemoDataService {
    private final JdbcTemplate jdbc;
    private final TenantSessionContext tenantContext;
    private final SetorService setorService;
    private final CategoryService categoryService;
    private final SupplierService supplierService;
    private final ColaboradorService collaboratorService;
    private final EpiService epiService;
    private final StockService stockService;
    private final DeliveryService deliveryService;
    private final ReturnService returnService;

    public DemoDataService(
            JdbcTemplate jdbc,
            TenantSessionContext tenantContext,
            SetorService setorService,
            CategoryService categoryService,
            SupplierService supplierService,
            ColaboradorService collaboratorService,
            EpiService epiService,
            StockService stockService,
            DeliveryService deliveryService,
            ReturnService returnService) {
        this.jdbc = jdbc;
        this.tenantContext = tenantContext;
        this.setorService = setorService;
        this.categoryService = categoryService;
        this.supplierService = supplierService;
        this.collaboratorService = collaboratorService;
        this.epiService = epiService;
        this.stockService = stockService;
        this.deliveryService = deliveryService;
        this.returnService = returnService;
    }

    @Transactional
    public Map<String, Object> seed(Jwt jwt) {
        if (jwt == null || !"ACCESS".equals(jwt.getClaimAsString("token_type"))) {
            throw new AccessDeniedException("É necessário um token de acesso válido.");
        }
        UUID companyId;
        UUID userId;
        try {
            companyId = UUID.fromString(jwt.getClaimAsString("tenant_id"));
            userId = UUID.fromString(jwt.getSubject());
        } catch (RuntimeException exception) {
            throw new AccessDeniedException("O token não contém um contexto de empresa válido.");
        }
        tenantContext.activate(companyId, userId);

        // Serializa duas solicitações simultâneas e mantém a carga idempotente por empresa.
        jdbc.queryForObject("SELECT id FROM epi_manager.empresas WHERE id = ? FOR UPDATE", UUID.class, companyId);
        Boolean alreadySeeded = jdbc.queryForObject(
                "SELECT EXISTS (SELECT 1 FROM epi_manager.notificacoes WHERE empresa_id = ? AND referencia_tipo = 'DEMO_SEED')",
                Boolean.class, companyId);
        if (Boolean.TRUE.equals(alreadySeeded)) {
            return Map.of("alreadyLoaded", true, "message", "Os dados demonstrativos já foram carregados nesta empresa.");
        }

        LocalDate today = LocalDate.now();

        List<SetorResponse> sectors = List.of(
                setorService.create(jwt, new CreateSetorRequest("Produção", "Linha de produção e operação industrial.")),
                setorService.create(jwt, new CreateSetorRequest("Manutenção", "Manutenção preventiva e corretiva.")),
                setorService.create(jwt, new CreateSetorRequest("Logística", "Recebimento, armazenagem e expedição.")),
                setorService.create(jwt, new CreateSetorRequest("Administrativo", "Rotinas administrativas e apoio.")));

        List<CategoryResponse> categories = List.of(
                categoryService.create(jwt, new CategoryRequest("Proteção da cabeça", "Capacetes e acessórios de proteção craniana.")),
                categoryService.create(jwt, new CategoryRequest("Proteção dos olhos", "Óculos e protetores faciais.")),
                categoryService.create(jwt, new CategoryRequest("Proteção das mãos", "Luvas para atividades operacionais.")),
                categoryService.create(jwt, new CategoryRequest("Proteção dos pés", "Calçados de segurança.")),
                categoryService.create(jwt, new CategoryRequest("Proteção auditiva", "Protetores auriculares.")),
                categoryService.create(jwt, new CategoryRequest("Proteção respiratória", "Respiradores descartáveis e reutilizáveis.")));

        List<SupplierResponse> suppliers = List.of(
                supplierService.create(jwt, new SupplierRequest("Nexus Distribuição de EPIs (Demonstração)", "Nexus EPIs", null, null, null, "Atendimento demonstrativo")),
                supplierService.create(jwt, new SupplierRequest("Protege Equipamentos (Demonstração)", "Protege Equipamentos", null, null, null, "Equipe comercial")),
                supplierService.create(jwt, new SupplierRequest("Segurança Industrial (Demonstração)", "Segurança Industrial", null, null, null, "Equipe de vendas")));

        List<ColaboradorResponse> collaborators = List.of(
                collaboratorService.create(jwt, new CreateColaboradorRequest(sectors.get(0).id(), "NX-001", "Marcos Almeida", null, null, "Operador de Produção", today.minusYears(3))),
                collaboratorService.create(jwt, new CreateColaboradorRequest(sectors.get(0).id(), "NX-002", "Camila Rodrigues", null, null, "Supervisora de Produção", today.minusYears(2))),
                collaboratorService.create(jwt, new CreateColaboradorRequest(sectors.get(1).id(), "NX-003", "Rafael Martins", null, null, "Técnico de Manutenção", today.minusYears(1))),
                collaboratorService.create(jwt, new CreateColaboradorRequest(sectors.get(1).id(), "NX-004", "Bruna Costa", null, null, "Auxiliar de Manutenção", today.minusMonths(8))),
                collaboratorService.create(jwt, new CreateColaboradorRequest(sectors.get(2).id(), "NX-005", "Diego Ferreira", null, null, "Auxiliar de Logística", today.minusMonths(6))),
                collaboratorService.create(jwt, new CreateColaboradorRequest(sectors.get(3).id(), "NX-006", "Juliana Ribeiro", null, null, "Assistente Administrativa", today.minusMonths(4))));

        List<EpiResponse> epis = List.of(
                epiService.create(jwt, new EpiRequest(categories.get(0).id(), "DEMO-EPI-001", "Capacete de segurança com aba frontal", "Equipamento demonstrativo para proteção da cabeça.", "Linha demonstrativa", "Capacete classe B", "DEMO-CA-001", today.plusYears(1), UnidadeMedida.UN, new BigDecimal("5"), 365)),
                epiService.create(jwt, new EpiRequest(categories.get(1).id(), "DEMO-EPI-002", "Óculos de proteção incolor", "Óculos demonstrativo contra partículas volantes.", "Linha demonstrativa", "Óculos incolor", "DEMO-CA-002", today.plusYears(1), UnidadeMedida.UN, new BigDecimal("8"), 180)),
                epiService.create(jwt, new EpiRequest(categories.get(2).id(), "DEMO-EPI-003", "Luva de proteção mecânica", "Luva demonstrativa para atividades de montagem.", "Linha demonstrativa", "Luva de segurança", "DEMO-CA-003", today.plusYears(1), UnidadeMedida.PAR, new BigDecimal("10"), 90)),
                epiService.create(jwt, new EpiRequest(categories.get(3).id(), "DEMO-EPI-004", "Botina de segurança", "Calçado demonstrativo com biqueira de proteção.", "Linha demonstrativa", "Botina ocupacional", "DEMO-CA-004", today.plusYears(1), UnidadeMedida.PAR, new BigDecimal("5"), 365)),
                epiService.create(jwt, new EpiRequest(categories.get(4).id(), "DEMO-EPI-005", "Protetor auricular tipo plug", "Protetor auditivo demonstrativo.", "Linha demonstrativa", "Plug auricular", "DEMO-CA-005", today.plusYears(1), UnidadeMedida.UN, new BigDecimal("20"), 90)),
                epiService.create(jwt, new EpiRequest(categories.get(5).id(), "DEMO-EPI-006", "Respirador descartável PFF2", "Respirador demonstrativo para proteção respiratória.", "Linha demonstrativa", "PFF2", "DEMO-CA-006", today.plusYears(1), UnidadeMedida.UN, new BigDecimal("15"), 30)));

        List<StockReceiptResponse> lots = List.of(
                stockService.receive(jwt, new StockReceiptRequest(epis.get(0).id(), suppliers.get(0).id(), "NX-CAP-2026-01", today.minusMonths(1), today.plusMonths(12), new BigDecimal("50"), new BigDecimal("32.90"), "Lote demonstrativo inicial.")),
                stockService.receive(jwt, new StockReceiptRequest(epis.get(1).id(), suppliers.get(1).id(), "NX-OCU-2026-01", today.minusMonths(1), today.plusMonths(12), new BigDecimal("35"), new BigDecimal("12.50"), "Lote demonstrativo inicial.")),
                stockService.receive(jwt, new StockReceiptRequest(epis.get(2).id(), suppliers.get(2).id(), "NX-LUV-2026-01", today.minusMonths(1), today.plusMonths(12), new BigDecimal("60"), new BigDecimal("8.75"), "Lote demonstrativo inicial.")),
                stockService.receive(jwt, new StockReceiptRequest(epis.get(3).id(), suppliers.get(0).id(), "NX-BOT-2026-01", today.minusMonths(1), today.plusMonths(12), new BigDecimal("25"), new BigDecimal("89.90"), "Lote demonstrativo inicial.")),
                stockService.receive(jwt, new StockReceiptRequest(epis.get(4).id(), suppliers.get(1).id(), "NX-AUD-2026-01", today.minusMonths(1), today.plusDays(26), new BigDecimal("18"), new BigDecimal("2.90"), "Lote demonstrativo com validade próxima para ilustrar alertas.")),
                stockService.receive(jwt, new StockReceiptRequest(epis.get(5).id(), suppliers.get(2).id(), "NX-RES-2026-01", today.minusMonths(1), today.plusMonths(10), new BigDecimal("40"), new BigDecimal("4.50"), "Lote demonstrativo inicial.")));

        DeliveryResponse completedDelivery = deliveryService.create(jwt, new DeliveryRequest(
                collaborators.get(0).id(), today.minusDays(5), "Entrega demonstrativa concluída.",
                List.of(
                        new DeliveryItemRequest(epis.get(0).id(), lots.get(0).loteId(), BigDecimal.ONE, today.plusYears(1), "Capacete entregue."),
                        new DeliveryItemRequest(epis.get(1).id(), lots.get(1).loteId(), BigDecimal.ONE, today.plusMonths(6), "Óculos entregue."),
                        new DeliveryItemRequest(epis.get(2).id(), lots.get(2).loteId(), BigDecimal.ONE, today.plusMonths(3), "Luva entregue."))));
        completedDelivery = deliveryService.confirm(jwt, completedDelivery.id());

        DeliveryResponse secondCompletedDelivery = deliveryService.create(jwt, new DeliveryRequest(
                collaborators.get(2).id(), today.minusDays(2), "Entrega de calçado para atividade de manutenção.",
                List.of(new DeliveryItemRequest(epis.get(3).id(), lots.get(3).loteId(), BigDecimal.ONE, today.plusYears(1), "Botina entregue."))));
        deliveryService.confirm(jwt, secondCompletedDelivery.id());

        returnService.confirm(jwt, returnService.create(jwt, new ReturnRequest(
                completedDelivery.id(), today.minusDays(1), "Devolução demonstrativa de item reutilizável.",
                List.of(new ReturnItemRequest(completedDelivery.itens().get(2).id(), BigDecimal.ONE,
                        ReturnItemRequest.Condition.REUTILIZAVEL, "Item em condições de reutilização.")))).id());

        DeliveryResponse pendingOne = deliveryService.create(jwt, new DeliveryRequest(
                collaborators.get(4).id(), today.plusDays(1), "Separar EPIs para novo colaborador da logística.",
                List.of(
                        new DeliveryItemRequest(epis.get(4).id(), lots.get(4).loteId(), new BigDecimal("2"), today.plusMonths(3), "Protetor auricular."),
                        new DeliveryItemRequest(epis.get(1).id(), lots.get(1).loteId(), BigDecimal.ONE, today.plusMonths(6), "Óculos de proteção."))));
        DeliveryResponse pendingTwo = deliveryService.create(jwt, new DeliveryRequest(
                collaborators.get(3).id(), today.plusDays(2), "Entrega programada para manutenção.",
                List.of(
                        new DeliveryItemRequest(epis.get(5).id(), lots.get(5).loteId(), new BigDecimal("2"), today.plusMonths(1), "Respiradores PFF2."),
                        new DeliveryItemRequest(epis.get(2).id(), lots.get(2).loteId(), new BigDecimal("2"), today.plusMonths(3), "Luvas de proteção."))));

        jdbc.update(
                """
                INSERT INTO epi_manager.notificacoes
                    (empresa_id, tipo, nivel, titulo, mensagem, referencia_tipo, lida)
                VALUES (?, 'SISTEMA', 'INFO', 'Dados demonstrativos carregados',
                        'Registros fictícios de demonstração foram adicionados à empresa. Códigos CA e fornecedores são ilustrativos e não representam certificações ou empresas reais.',
                        'DEMO_SEED', FALSE)
                """,
                companyId);
        jdbc.update(
                """
                INSERT INTO epi_manager.notificacoes
                    (empresa_id, tipo, nivel, titulo, mensagem, referencia_tipo, referencia_id, lida)
                VALUES (?, 'ESTOQUE_MINIMO', 'ATENCAO', 'Estoque abaixo do mínimo',
                        'O protetor auricular está abaixo do estoque mínimo configurado. Registro ilustrativo.',
                        'EPI', ?, FALSE)
                """,
                companyId, epis.get(4).id());

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("alreadyLoaded", false);
        result.put("sectors", sectors.size());
        result.put("categories", categories.size());
        result.put("suppliers", suppliers.size());
        result.put("collaborators", collaborators.size());
        result.put("epis", epis.size());
        result.put("stockLots", lots.size());
        result.put("completedDeliveries", 2);
        result.put("pendingDeliveries", 2);
        result.put("confirmedReturns", 1);
        result.put("message", "Dados demonstrativos criados com sucesso.");
        return result;
    }
}
