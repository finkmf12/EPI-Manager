package com.visage.epimanager.catalog.persistence;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface EpiRepository extends JpaRepository<EpiEntity, UUID> {
    List<EpiEntity> findAllByEmpresaIdOrderByNome(UUID empresaId);
    List<EpiEntity> findAllByEmpresaIdAndAtivoTrueOrderByNome(UUID empresaId);
    Optional<EpiEntity> findByIdAndEmpresaId(UUID id, UUID empresaId);
}
