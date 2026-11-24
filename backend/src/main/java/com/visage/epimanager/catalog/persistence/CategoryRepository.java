package com.visage.epimanager.catalog.persistence;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CategoryRepository extends JpaRepository<CategoryEntity, UUID> {
    List<CategoryEntity> findAllByEmpresaIdOrderByNome(UUID empresaId);
    List<CategoryEntity> findAllByEmpresaIdAndAtivoTrueOrderByNome(UUID empresaId);
    Optional<CategoryEntity> findByIdAndEmpresaId(UUID id, UUID empresaId);
    Optional<CategoryEntity> findByIdAndEmpresaIdAndAtivoTrue(UUID id, UUID empresaId);
    boolean existsByEmpresaIdAndNomeIgnoreCase(UUID empresaId, String nome);
    boolean existsByEmpresaIdAndNomeIgnoreCaseAndIdNot(UUID empresaId, String nome, UUID id);
}
