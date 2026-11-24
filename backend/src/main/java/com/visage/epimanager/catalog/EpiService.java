package com.visage.epimanager.catalog;

import com.visage.epimanager.catalog.dto.EpiRequest;
import com.visage.epimanager.catalog.dto.EpiResponse;
import com.visage.epimanager.catalog.persistence.CategoryRepository;
import com.visage.epimanager.catalog.persistence.EpiEntity;
import com.visage.epimanager.catalog.persistence.EpiRepository;
import com.visage.epimanager.common.ResourceNotFoundException;
import com.visage.epimanager.security.TenantSessionContext;
import java.util.List;
import java.util.UUID;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class EpiService {
    private final EpiRepository repository;
    private final CategoryRepository categoryRepository;
    private final TenantSessionContext tenantSessionContext;

    public EpiService(
            EpiRepository repository,
            CategoryRepository categoryRepository,
            TenantSessionContext tenantSessionContext) {
        this.repository = repository;
        this.categoryRepository = categoryRepository;
        this.tenantSessionContext = tenantSessionContext;
    }

    @Transactional(readOnly = true)
    public List<EpiResponse> list(Jwt jwt, boolean includeInactive) {
        UUID companyId = activateTenant(jwt);
        List<EpiEntity> epis = includeInactive
                ? repository.findAllByEmpresaIdOrderByNome(companyId)
                : repository.findAllByEmpresaIdAndAtivoTrueOrderByNome(companyId);
        return epis.stream().map(EpiResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public EpiResponse findById(Jwt jwt, UUID epiId) {
        UUID companyId = activateTenant(jwt);
        EpiEntity epi = repository.findByIdAndEmpresaId(epiId, companyId)
                .orElseThrow(() -> new ResourceNotFoundException("EPI não encontrado."));
        return EpiResponse.from(epi);
    }

    @Transactional
    public EpiResponse create(Jwt jwt, EpiRequest request) {
        UUID companyId = activateTenant(jwt);
        validateCategory(companyId, request.categoriaId());
        EpiEntity saved = repository.saveAndFlush(new EpiEntity(companyId, request));
        return EpiResponse.from(saved);
    }

    @Transactional
    public EpiResponse update(Jwt jwt, UUID epiId, EpiRequest request) {
        UUID companyId = activateTenant(jwt);
        validateCategory(companyId, request.categoriaId());
        EpiEntity epi = repository.findByIdAndEmpresaId(epiId, companyId)
                .orElseThrow(() -> new ResourceNotFoundException("EPI não encontrado."));
        if (!epi.isAtivo()) {
            throw new IllegalArgumentException("Não é permitido editar um EPI inativo.");
        }
        epi.update(request);
        return EpiResponse.from(epi);
    }

    @Transactional
    public void deactivate(Jwt jwt, UUID epiId) {
        UUID companyId = activateTenant(jwt);
        EpiEntity epi = repository.findByIdAndEmpresaId(epiId, companyId)
                .orElseThrow(() -> new ResourceNotFoundException("EPI não encontrado."));
        epi.deactivate();
    }

    private void validateCategory(UUID companyId, UUID categoryId) {
        if (categoryId != null && categoryRepository
                .findByIdAndEmpresaIdAndAtivoTrue(categoryId, companyId).isEmpty()) {
            throw new ResourceNotFoundException("Categoria ativa não encontrada nesta empresa.");
        }
    }

    private UUID activateTenant(Jwt jwt) {
        if (jwt == null || !"ACCESS".equals(jwt.getClaimAsString("token_type"))) {
            throw new AccessDeniedException("É necessário um token de acesso válido.");
        }
        UUID companyId = UUID.fromString(jwt.getClaimAsString("tenant_id"));
        tenantSessionContext.activate(companyId, UUID.fromString(jwt.getSubject()));
        return companyId;
    }
}
