package com.visage.epimanager.supplier.persistence;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SupplierRepository extends JpaRepository<SupplierEntity, UUID> {
    List<SupplierEntity> findAllByEmpresaIdOrderByRazaoSocial(UUID empresaId);
    List<SupplierEntity> findAllByEmpresaIdAndAtivoTrueOrderByRazaoSocial(UUID empresaId);
    Optional<SupplierEntity> findByIdAndEmpresaId(UUID id, UUID empresaId);
    boolean existsByEmpresaIdAndCnpj(UUID empresaId, String cnpj);
    boolean existsByEmpresaIdAndCnpjAndIdNot(UUID empresaId, String cnpj, UUID id);
}
