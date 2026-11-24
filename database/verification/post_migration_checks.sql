-- Run with an administrative read-only connection after applying migrations.

-- 1. Table, policy, trigger and function counts; no domain tables left in public.
SELECT
  (SELECT count(*) FROM pg_tables WHERE schemaname = 'epi_manager') AS app_tables,
  (SELECT count(*) FROM pg_tables WHERE schemaname = 'public') AS remaining_public_tables,
  (SELECT count(*) FROM pg_policies WHERE schemaname = 'epi_manager') AS rls_policies,
  (SELECT count(*) FROM information_schema.triggers WHERE event_object_schema = 'epi_manager') AS triggers,
  (SELECT count(*) FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace WHERE n.nspname = 'epi_manager') AS functions;

-- 2. Every application table should have RLS enabled and forced.
SELECT tablename, rowsecurity, forcerowsecurity
FROM pg_tables t
JOIN pg_class c ON c.relname = t.tablename
JOIN pg_namespace n ON n.oid = c.relnamespace AND n.nspname = t.schemaname
WHERE t.schemaname = 'epi_manager'
ORDER BY tablename;

-- 3. Confirm the Data API roles cannot use the private schema.
SELECT
  has_schema_privilege('anon', 'epi_manager', 'USAGE') AS anon_usage,
  has_schema_privilege('authenticated', 'epi_manager', 'USAGE') AS authenticated_usage,
  has_schema_privilege('service_role', 'epi_manager', 'USAGE') AS service_role_usage,
  has_schema_privilege('epi_manager_runtime', 'epi_manager', 'USAGE') AS runtime_usage;

-- 4. Confirm ledger tables are append-only for the runtime role.
SELECT
  has_table_privilege('epi_manager_runtime', 'epi_manager.movimentacoes_estoque', 'UPDATE') AS runtime_can_update_stock_ledger,
  has_table_privilege('epi_manager_runtime', 'epi_manager.movimentacoes_estoque', 'DELETE') AS runtime_can_delete_stock_ledger,
  has_table_privilege('epi_manager_runtime', 'epi_manager.logs_auditoria', 'DELETE') AS runtime_can_delete_audit,
  has_table_privilege('epi_manager_runtime', 'epi_manager.assinaturas', 'UPDATE') AS runtime_can_update_signatures;
