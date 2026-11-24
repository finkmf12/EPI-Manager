package com.visage.epimanager.company.persistence;

import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface EmpresaRepository extends JpaRepository<EmpresaEntity, UUID> {
}
