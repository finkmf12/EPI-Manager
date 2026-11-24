package com.visage.epimanager.collaborator;

import com.visage.epimanager.collaborator.dto.ColaboradorResponse;
import com.visage.epimanager.collaborator.dto.CreateColaboradorRequest;
import com.visage.epimanager.collaborator.dto.UpdateColaboradorRequest;
import com.visage.epimanager.collaborator.persistence.ColaboradorEntity;
import com.visage.epimanager.collaborator.persistence.ColaboradorRepository;
import com.visage.epimanager.common.ResourceNotFoundException;
import com.visage.epimanager.sector.persistence.SetorRepository;
import com.visage.epimanager.security.TenantSessionContext;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ColaboradorService {
    private final ColaboradorRepository repository;
    private final SetorRepository setorRepository;
    private final TenantSessionContext tenantSessionContext;

    public ColaboradorService(
            ColaboradorRepository repository,
            SetorRepository setorRepository,
            TenantSessionContext tenantSessionContext) {
        this.repository = repository;
        this.setorRepository = setorRepository;
        this.tenantSessionContext = tenantSessionContext;
    }

    @Transactional(readOnly = true)
    public List<ColaboradorResponse> list(Jwt jwt, String status) {
        UUID companyId = activateTenant(jwt);
        List<ColaboradorEntity> entities = status == null || status.isBlank()
                ? repository.findAllByEmpresaIdOrderByNome(companyId)
                : repository.findAllByEmpresaIdAndStatusOrderByNome(companyId, normalizeStatus(status));
        return entities.stream().map(ColaboradorResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public ColaboradorResponse findById(Jwt jwt, UUID colaboradorId) {
        UUID companyId = activateTenant(jwt);
        ColaboradorEntity entity = repository.findByIdAndEmpresaId(colaboradorId, companyId)
                .orElseThrow(() -> new ResourceNotFoundException("Colaborador não encontrado."));
        return ColaboradorResponse.from(entity);
    }

    @Transactional
    public ColaboradorResponse create(Jwt jwt, CreateColaboradorRequest request) {
        UUID companyId = activateTenant(jwt);
        validateSector(companyId, request.setorId());
        ColaboradorEntity saved = repository.save(new ColaboradorEntity(
                companyId,
                request.setorId(),
                request.matricula().trim(),
                request.nome().trim(),
                normalizeEmail(request.email()),
                normalizeOptional(request.telefone()),
                normalizeOptional(request.cargo()),
                request.dataAdmissao()));
        return ColaboradorResponse.from(saved);
    }

    @Transactional
    public ColaboradorResponse update(Jwt jwt, UUID colaboradorId, UpdateColaboradorRequest request) {
        UUID companyId = activateTenant(jwt);
        validateSector(companyId, request.setorId());
        ColaboradorEntity entity = repository.findByIdAndEmpresaId(colaboradorId, companyId)
                .orElseThrow(() -> new ResourceNotFoundException("Colaborador não encontrado."));
        entity.update(
                request.setorId(),
                request.matricula().trim(),
                request.nome().trim(),
                normalizeEmail(request.email()),
                normalizeOptional(request.telefone()),
                normalizeOptional(request.cargo()),
                request.dataAdmissao());
        return ColaboradorResponse.from(entity);
    }

    @Transactional
    public ColaboradorResponse changeStatus(Jwt jwt, UUID colaboradorId, String status) {
        UUID companyId = activateTenant(jwt);
        ColaboradorEntity entity = repository.findByIdAndEmpresaId(colaboradorId, companyId)
                .orElseThrow(() -> new ResourceNotFoundException("Colaborador não encontrado."));
        entity.changeStatus(normalizeStatus(status));
        return ColaboradorResponse.from(entity);
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

    private void validateSector(UUID companyId, UUID setorId) {
        if (setorId != null && setorRepository.findByIdAndEmpresaIdAndAtivoTrue(setorId, companyId).isEmpty()) {
            throw new ResourceNotFoundException("Setor ativo não encontrado nesta empresa.");
        }
    }

    private String normalizeEmail(String email) {
        return email == null || email.isBlank() ? null : email.trim().toLowerCase(Locale.ROOT);
    }

    private String normalizeOptional(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private String normalizeStatus(String status) {
        String normalized = status == null ? "" : status.trim().toUpperCase(Locale.ROOT);
        if (!List.of("ATIVO", "INATIVO", "AFASTADO").contains(normalized)) {
            throw new IllegalArgumentException("Status deve ser ATIVO, INATIVO ou AFASTADO.");
        }
        return normalized;
    }
}
