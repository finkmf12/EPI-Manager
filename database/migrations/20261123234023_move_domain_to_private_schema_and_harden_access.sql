-- APPLIED 2026-11-23 to project mvebibtufpobpvhcrkmg.
-- Moves the pre-existing, empty 17-table domain schema from public to epi_manager.
-- Do not rerun against the already-migrated project.

BEGIN;

CREATE SCHEMA epi_manager AUTHORIZATION postgres;
REVOKE ALL ON SCHEMA epi_manager FROM PUBLIC, anon, authenticated, service_role;
REVOKE CREATE ON SCHEMA epi_manager FROM epi_manager_runtime;
GRANT USAGE ON SCHEMA epi_manager TO epi_manager_runtime;

ALTER TABLE public.empresas SET SCHEMA epi_manager;
ALTER TABLE public.usuarios SET SCHEMA epi_manager;
ALTER TABLE public.usuarios_empresas SET SCHEMA epi_manager;
ALTER TABLE public.setores SET SCHEMA epi_manager;
ALTER TABLE public.colaboradores SET SCHEMA epi_manager;
ALTER TABLE public.categorias_epi SET SCHEMA epi_manager;
ALTER TABLE public.epis SET SCHEMA epi_manager;
ALTER TABLE public.fornecedores SET SCHEMA epi_manager;
ALTER TABLE public.lotes_estoque SET SCHEMA epi_manager;
ALTER TABLE public.movimentacoes_estoque SET SCHEMA epi_manager;
ALTER TABLE public.entregas SET SCHEMA epi_manager;
ALTER TABLE public.itens_entrega SET SCHEMA epi_manager;
ALTER TABLE public.devolucoes SET SCHEMA epi_manager;
ALTER TABLE public.itens_devolucao SET SCHEMA epi_manager;
ALTER TABLE public.assinaturas SET SCHEMA epi_manager;
ALTER TABLE public.notificacoes SET SCHEMA epi_manager;
ALTER TABLE public.logs_auditoria SET SCHEMA epi_manager;

ALTER FUNCTION public.fn_app_admin_plataforma() SET SCHEMA epi_manager;
ALTER FUNCTION public.fn_app_empresa_id() SET SCHEMA epi_manager;
ALTER FUNCTION public.fn_app_onboarding() SET SCHEMA epi_manager;
ALTER FUNCTION public.fn_app_usuario_id() SET SCHEMA epi_manager;
ALTER FUNCTION public.fn_bloquear_item_devolucao_fechada() SET SCHEMA epi_manager;
ALTER FUNCTION public.fn_bloquear_item_entrega_fechada() SET SCHEMA epi_manager;
ALTER FUNCTION public.fn_impedir_alteracao_historico() SET SCHEMA epi_manager;
ALTER FUNCTION public.fn_processar_devolucao_confirmada() SET SCHEMA epi_manager;
ALTER FUNCTION public.fn_processar_entrega_confirmada() SET SCHEMA epi_manager;
ALTER FUNCTION public.fn_set_updated_at() SET SCHEMA epi_manager;
ALTER FUNCTION public.fn_validar_estado_devolucao() SET SCHEMA epi_manager;
ALTER FUNCTION public.fn_validar_estado_entrega() SET SCHEMA epi_manager;
ALTER FUNCTION public.fn_validar_total_devolvido() SET SCHEMA epi_manager;

DO $rewrite$
DECLARE
  r record;
  v_definition text;
BEGIN
  FOR r IN
    SELECT p.oid
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'epi_manager'
  LOOP
    v_definition := pg_get_functiondef(r.oid);
    IF position('public.' IN v_definition) > 0 THEN
      EXECUTE replace(v_definition, 'public.', 'epi_manager.');
    END IF;
    EXECUTE format(
      'ALTER FUNCTION %s SET search_path TO pg_catalog, epi_manager',
      r.oid::regprocedure
    );
  END LOOP;
END
$rewrite$;

DO $rls$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'epi_manager'
  LOOP
    EXECUTE format(
      'ALTER TABLE epi_manager.%I FORCE ROW LEVEL SECURITY',
      r.tablename
    );
  END LOOP;
END
$rls$;

REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA epi_manager
  FROM PUBLIC, anon, authenticated, service_role;
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA epi_manager
  TO epi_manager_runtime;
REVOKE DELETE ON ALL TABLES IN SCHEMA epi_manager
  FROM epi_manager_runtime;

REVOKE UPDATE, DELETE ON TABLE
  epi_manager.movimentacoes_estoque,
  epi_manager.logs_auditoria,
  epi_manager.assinaturas
FROM epi_manager_runtime;

REVOKE ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA epi_manager
  FROM PUBLIC, anon, authenticated, service_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA epi_manager
  TO epi_manager_runtime;

REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA epi_manager
  FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA epi_manager
  TO epi_manager_runtime;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA epi_manager
  REVOKE ALL ON TABLES FROM PUBLIC, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA epi_manager
  GRANT SELECT, INSERT, UPDATE ON TABLES TO epi_manager_runtime;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA epi_manager
  REVOKE DELETE ON TABLES FROM epi_manager_runtime;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA epi_manager
  REVOKE ALL ON SEQUENCES FROM PUBLIC, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA epi_manager
  GRANT USAGE, SELECT ON SEQUENCES TO epi_manager_runtime;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA epi_manager
  REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA epi_manager
  GRANT EXECUTE ON FUNCTIONS TO epi_manager_runtime;

REVOKE CREATE ON SCHEMA public FROM PUBLIC, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE ALL ON TABLES FROM PUBLIC, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE ALL ON SEQUENCES FROM PUBLIC, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC, anon, authenticated, service_role;

COMMIT;
