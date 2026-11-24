package com.visage.epimanager.collaborator.persistence;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ColaboradorRepository extends JpaRepository<ColaboradorEntity, UUID> {
    List<ColaboradorEntity> findAllByEmpresaIdOrderByNome(UUID empresaId);
    List<ColaboradorEntity> findAllByEmpresaIdAndStatusOrderByNome(UUID empresaId, String status);
    Optional<ColaboradorEntity> findByIdAndEmpresaId(UUID id, UUID empresaId);
    boolean existsByEmpresaIdAndMatriculaIgnoreCase(UUID empresaId, String matricula);
    boolean existsByEmpresaIdAndMatriculaIgnoreCaseAndIdNot(UUID empresaId, String matricula, UUID id);
}
