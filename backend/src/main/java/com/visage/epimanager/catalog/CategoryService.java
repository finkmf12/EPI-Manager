package com.visage.epimanager.catalog;

import com.visage.epimanager.catalog.dto.CategoryRequest;
import com.visage.epimanager.catalog.dto.CategoryResponse;
import com.visage.epimanager.catalog.persistence.CategoryEntity;
import com.visage.epimanager.catalog.persistence.CategoryRepository;
import com.visage.epimanager.common.ResourceNotFoundException;
import com.visage.epimanager.security.TenantSessionContext;
import java.util.List;
import java.util.UUID;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CategoryService {
    private final CategoryRepository repository;
    private final TenantSessionContext tenantSessionContext;

    public CategoryService(CategoryRepository repository, TenantSessionContext tenantSessionContext) {
        this.repository = repository;
        this.tenantSessionContext = tenantSessionContext;
    }

    @Transactional(readOnly = true)
    public List<CategoryResponse> list(Jwt jwt, boolean includeInactive) {
        UUID companyId = activateTenant(jwt);
        List<CategoryEntity> categories = includeInactive
                ? repository.findAllByEmpresaIdOrderByNome(companyId)
                : repository.findAllByEmpresaIdAndAtivoTrueOrderByNome(companyId);
        return categories.stream().map(CategoryResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public CategoryResponse findById(Jwt jwt, UUID categoryId) {
        UUID companyId = activateTenant(jwt);
        CategoryEntity category = repository.findByIdAndEmpresaId(categoryId, companyId)
                .orElseThrow(() -> new ResourceNotFoundException("Categoria não encontrada."));
        return CategoryResponse.from(category);
    }

    @Transactional
    public CategoryResponse create(Jwt jwt, CategoryRequest request) {
        UUID companyId = activateTenant(jwt);
        CategoryEntity saved = repository.save(new CategoryEntity(
                companyId, request.nome().trim(), normalizeOptional(request.descricao())));
        return CategoryResponse.from(saved);
    }

    @Transactional
    public CategoryResponse update(Jwt jwt, UUID categoryId, CategoryRequest request) {
        UUID companyId = activateTenant(jwt);
        CategoryEntity category = repository.findByIdAndEmpresaId(categoryId, companyId)
                .orElseThrow(() -> new ResourceNotFoundException("Categoria não encontrada."));
        if (!category.isAtivo()) {
            throw new IllegalArgumentException("Não é permitido editar uma categoria inativa.");
        }
        category.update(request.nome().trim(), normalizeOptional(request.descricao()));
        return CategoryResponse.from(category);
    }

    @Transactional
    public void deactivate(Jwt jwt, UUID categoryId) {
        UUID companyId = activateTenant(jwt);
        CategoryEntity category = repository.findByIdAndEmpresaId(categoryId, companyId)
                .orElseThrow(() -> new ResourceNotFoundException("Categoria não encontrada."));
        category.deactivate();
    }

    private UUID activateTenant(Jwt jwt) {
        if (jwt == null || !"ACCESS".equals(jwt.getClaimAsString("token_type"))) {
            throw new AccessDeniedException("É necessário um token de acesso válido.");
        }
        UUID companyId = UUID.fromString(jwt.getClaimAsString("tenant_id"));
        tenantSessionContext.activate(companyId, UUID.fromString(jwt.getSubject()));
        return companyId;
    }

    private String normalizeOptional(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
