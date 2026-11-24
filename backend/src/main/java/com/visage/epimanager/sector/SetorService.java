package com.visage.epimanager.sector;

import com.visage.epimanager.common.ResourceNotFoundException;
import com.visage.epimanager.sector.dto.CreateSetorRequest;
import com.visage.epimanager.sector.dto.SetorResponse;
import com.visage.epimanager.sector.dto.UpdateSetorRequest;
import com.visage.epimanager.sector.persistence.SetorEntity;
import com.visage.epimanager.sector.persistence.SetorRepository;
import com.visage.epimanager.security.TenantSessionContext;
import java.util.List;
import java.util.UUID;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class SetorService {
    private final SetorRepository repository;
    private final TenantSessionContext tenantSessionContext;

    public SetorService(SetorRepository repository, TenantSessionContext tenantSessionContext) {
        this.repository = repository;
        this.tenantSessionContext = tenantSessionContext;
    }

    @Transactional(readOnly = true)
    public List<SetorResponse> list(Jwt jwt, boolean includeInactive) {
        UUID companyId = activateTenant(jwt);
        List<SetorEntity> entities = includeInactive
                ? repository.findAllByEmpresaIdOrderByNome(companyId)
                : repository.findAllByEmpresaIdAndAtivoTrueOrderByNome(companyId);
        return entities.stream().map(SetorResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public SetorResponse findById(Jwt jwt, UUID setorId) {
        UUID companyId = activateTenant(jwt);
        SetorEntity entity = repository.findByIdAndEmpresaId(setorId, companyId)
                .orElseThrow(() -> new ResourceNotFoundException("Setor não encontrado."));
        return SetorResponse.from(entity);
    }

    @Transactional
    public SetorResponse create(Jwt jwt, CreateSetorRequest request) {
        UUID companyId = activateTenant(jwt);
        SetorEntity saved = repository.save(new SetorEntity(
                companyId,
                request.nome().trim(),
                normalizeOptional(request.descricao())));
        return SetorResponse.from(saved);
    }

    @Transactional
    public SetorResponse update(Jwt jwt, UUID setorId, UpdateSetorRequest request) {
        UUID companyId = activateTenant(jwt);
        SetorEntity entity = repository.findByIdAndEmpresaId(setorId, companyId)
                .orElseThrow(() -> new ResourceNotFoundException("Setor não encontrado."));
        entity.update(request.nome().trim(), normalizeOptional(request.descricao()));
        return SetorResponse.from(entity);
    }

    @Transactional
    public void deactivate(Jwt jwt, UUID setorId) {
        UUID companyId = activateTenant(jwt);
        SetorEntity entity = repository.findByIdAndEmpresaId(setorId, companyId)
                .orElseThrow(() -> new ResourceNotFoundException("Setor não encontrado."));
        entity.deactivate();
    }

    private UUID activateTenant(Jwt jwt) {
        if (jwt == null || !"ACCESS".equals(jwt.getClaimAsString("token_type"))) {
            throw new AccessDeniedException("É necessário um token de acesso válido.");
        }
        UUID companyId = UUID.fromString(jwt.getClaimAsString("tenant_id"));
        UUID userId = UUID.fromString(jwt.getSubject());
        tenantSessionContext.activate(companyId, userId);
        return companyId;
    }

    private String normalizeOptional(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
