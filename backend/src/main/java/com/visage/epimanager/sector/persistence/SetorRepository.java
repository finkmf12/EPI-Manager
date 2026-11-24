package com.visage.epimanager.sector.persistence;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SetorRepository extends JpaRepository<SetorEntity, UUID> {
    List<SetorEntity> findAllByEmpresaIdOrderByNome(UUID empresaId);
    List<SetorEntity> findAllByEmpresaIdAndAtivoTrueOrderByNome(UUID empresaId);
    Optional<SetorEntity> findByIdAndEmpresaId(UUID id, UUID empresaId);
    Optional<SetorEntity> findByIdAndEmpresaIdAndAtivoTrue(UUID id, UUID empresaId);
}
