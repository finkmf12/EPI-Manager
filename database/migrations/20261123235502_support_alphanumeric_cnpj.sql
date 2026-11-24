ALTER TABLE epi_manager.empresas
  DROP CONSTRAINT empresas_cnpj_check,
  ADD CONSTRAINT empresas_cnpj_check
    CHECK (cnpj ~ '^[A-Z0-9]{12}[0-9]{2}$');

ALTER TABLE epi_manager.fornecedores
  DROP CONSTRAINT fornecedores_cnpj_check,
  ADD CONSTRAINT fornecedores_cnpj_check
    CHECK (cnpj IS NULL OR cnpj ~ '^[A-Z0-9]{12}[0-9]{2}$');
