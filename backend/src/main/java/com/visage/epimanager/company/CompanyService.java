package com.visage.epimanager.company;

import com.visage.epimanager.company.dto.CurrentCompanyResponse;
import com.visage.epimanager.company.persistence.EmpresaEntity;
import com.visage.epimanager.company.persistence.EmpresaRepository;
import com.visage.epimanager.security.TenantSessionContext;
import java.util.UUID;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CompanyService {
    private final EmpresaRepository empresaRepository;
    private final TenantSessionContext tenantSessionContext;

    public CompanyService(EmpresaRepository empresaRepository, TenantSessionContext tenantSessionContext) {
        this.empresaRepository = empresaRepository;
        this.tenantSessionContext = tenantSessionContext;
    }

    @Transactional(readOnly = true)
    public CurrentCompanyResponse getCurrentCompany(Jwt jwt) {
        if (!"ACCESS".equals(jwt.getClaimAsString("token_type"))) {
            throw new AccessDeniedException("É necessário um token de acesso válido.");
        }

        UUID companyId = UUID.fromString(jwt.getClaimAsString("tenant_id"));
        UUID userId = UUID.fromString(jwt.getSubject());
        tenantSessionContext.activate(companyId, userId);

        EmpresaEntity company = empresaRepository.findById(companyId)
                .orElseThrow(() -> new AccessDeniedException("Empresa não encontrada no contexto do usuário."));

        return new CurrentCompanyResponse(
                company.getId(),
                company.getRazaoSocial(),
                company.getNomeFantasia(),
                company.getCnpj(),
                company.getEmailContato(),
                company.getTelefone(),
                company.getStatus());
    }
}
