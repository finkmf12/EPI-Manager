package com.visage.epimanager.supplier;

import com.visage.epimanager.common.CnpjValidator;
import com.visage.epimanager.common.ConflictException;
import com.visage.epimanager.common.ResourceNotFoundException;
import com.visage.epimanager.security.TenantSessionContext;
import com.visage.epimanager.supplier.dto.SupplierRequest;
import com.visage.epimanager.supplier.dto.SupplierResponse;
import com.visage.epimanager.supplier.persistence.SupplierEntity;
import com.visage.epimanager.supplier.persistence.SupplierRepository;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class SupplierService {
    private final SupplierRepository repository;
    private final TenantSessionContext tenantSessionContext;

    public SupplierService(SupplierRepository repository, TenantSessionContext tenantSessionContext) {
        this.repository = repository;
        this.tenantSessionContext = tenantSessionContext;
    }

    @Transactional(readOnly = true)
    public List<SupplierResponse> list(Jwt jwt, boolean includeInactive) {
        UUID companyId = activateTenant(jwt);
        List<SupplierEntity> suppliers = includeInactive ? repository.findAllByEmpresaIdOrderByRazaoSocial(companyId) : repository.findAllByEmpresaIdAndAtivoTrueOrderByRazaoSocial(companyId);
        return suppliers.stream().map(SupplierResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public SupplierResponse findById(Jwt jwt, UUID supplierId) {
        UUID companyId = activateTenant(jwt);
        return SupplierResponse.from(repository.findByIdAndEmpresaId(supplierId, companyId).orElseThrow(() -> new ResourceNotFoundException("Fornecedor não encontrado.")));
    }

    @Transactional
    public SupplierResponse create(Jwt jwt, SupplierRequest request) {
        UUID companyId = activateTenant(jwt);
        SupplierRequest normalized = normalize(request);
        validateUniqueCnpj(companyId, normalized.cnpj(), null);
        return SupplierResponse.from(repository.save(new SupplierEntity(companyId, normalized)));
    }

    @Transactional
    public SupplierResponse update(Jwt jwt, UUID supplierId, SupplierRequest request) {
        UUID companyId = activateTenant(jwt);
        SupplierEntity supplier = repository.findByIdAndEmpresaId(supplierId, companyId).orElseThrow(() -> new ResourceNotFoundException("Fornecedor não encontrado."));
        if (!supplier.isAtivo()) throw new IllegalArgumentException("Não é permitido editar um fornecedor inativo.");
        SupplierRequest normalized = normalize(request);
        validateUniqueCnpj(companyId, normalized.cnpj(), supplierId);
        supplier.update(normalized);
        return SupplierResponse.from(supplier);
    }

    @Transactional
    public void deactivate(Jwt jwt, UUID supplierId) {
        UUID companyId = activateTenant(jwt);
        SupplierEntity supplier = repository.findByIdAndEmpresaId(supplierId, companyId).orElseThrow(() -> new ResourceNotFoundException("Fornecedor não encontrado."));
        supplier.deactivate();
    }

    @Transactional
    public SupplierResponse activate(Jwt jwt, UUID supplierId) {
        UUID companyId = activateTenant(jwt);
        SupplierEntity supplier = repository.findByIdAndEmpresaId(supplierId, companyId).orElseThrow(() -> new ResourceNotFoundException("Fornecedor não encontrado."));
        supplier.activate();
        return SupplierResponse.from(supplier);
    }

    private void validateUniqueCnpj(UUID companyId, String cnpj, UUID ignoredId) {
        if (cnpj == null) return;
        boolean exists = ignoredId == null ? repository.existsByEmpresaIdAndCnpj(companyId, cnpj) : repository.existsByEmpresaIdAndCnpjAndIdNot(companyId, cnpj, ignoredId);
        if (exists) throw new ConflictException("Já existe um fornecedor com este CNPJ nesta empresa.");
    }

    private UUID activateTenant(Jwt jwt) {
        if (jwt == null || !"ACCESS".equals(jwt.getClaimAsString("token_type"))) throw new AccessDeniedException("É necessário um token de acesso válido.");
        UUID companyId = UUID.fromString(jwt.getClaimAsString("tenant_id"));
        tenantSessionContext.activate(companyId, UUID.fromString(jwt.getSubject()));
        return companyId;
    }

    private SupplierRequest normalize(SupplierRequest request) {
        String cnpj = request.cnpj() == null || request.cnpj().isBlank() ? null : CnpjValidator.normalizeAndValidate(request.cnpj());
        String email = request.email() == null || request.email().isBlank() ? null : request.email().trim().toLowerCase(Locale.ROOT);
        return new SupplierRequest(request.razaoSocial().trim(), normalizeOptional(request.nomeFantasia()), cnpj, email, normalizeOptional(request.telefone()), normalizeOptional(request.contato()));
    }

    private String normalizeOptional(String value) { return value == null || value.isBlank() ? null : value.trim(); }
}
