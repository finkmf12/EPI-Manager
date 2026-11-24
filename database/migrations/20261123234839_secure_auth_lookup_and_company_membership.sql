-- Normalize email uniqueness for case-insensitive authentication.
CREATE UNIQUE INDEX IF NOT EXISTS uq_usuarios_email_lower
  ON epi_manager.usuarios (lower(email));

-- Narrow, server-only authentication lookup. It intentionally bypasses RLS
-- to resolve a login before a company context exists.
CREATE OR REPLACE FUNCTION epi_manager.fn_autenticar_usuario(p_email text)
RETURNS TABLE (
  usuario_id uuid,
  nome varchar,
  email varchar,
  senha_hash text,
  status varchar,
  papel_global varchar,
  empresas jsonb
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'pg_catalog', 'epi_manager'
AS $function$
  SELECT
    u.id,
    u.nome,
    u.email,
    u.senha_hash,
    u.status,
    u.papel_global,
    COALESCE(
      (
        SELECT jsonb_agg(
          jsonb_build_object(
            'empresaId', e.id,
            'razaoSocial', e.razao_social,
            'nomeFantasia', e.nome_fantasia,
            'perfil', ue.perfil
          )
          ORDER BY COALESCE(e.nome_fantasia, e.razao_social)
        )
        FROM epi_manager.usuarios_empresas ue
        JOIN epi_manager.empresas e ON e.id = ue.empresa_id
        WHERE ue.usuario_id = u.id
          AND ue.ativo = true
          AND e.status = 'ATIVA'
      ),
      '[]'::jsonb
    ) AS empresas
  FROM epi_manager.usuarios u
  WHERE lower(u.email) = lower(btrim(p_email))
    AND u.status = 'ATIVO'
  LIMIT 1;
$function$;

CREATE OR REPLACE FUNCTION epi_manager.fn_usuario_pertence_empresa(
  p_usuario_id uuid,
  p_empresa_id uuid
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'pg_catalog', 'epi_manager'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM epi_manager.usuarios_empresas ue
    JOIN epi_manager.usuarios u ON u.id = ue.usuario_id
    JOIN epi_manager.empresas e ON e.id = ue.empresa_id
    WHERE ue.usuario_id = p_usuario_id
      AND ue.empresa_id = p_empresa_id
      AND ue.ativo = true
      AND u.status = 'ATIVO'
      AND e.status = 'ATIVA'
  );
$function$;

REVOKE ALL ON FUNCTION epi_manager.fn_autenticar_usuario(text)
  FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION epi_manager.fn_usuario_pertence_empresa(uuid, uuid)
  FROM PUBLIC, anon, authenticated, service_role;

GRANT EXECUTE ON FUNCTION epi_manager.fn_autenticar_usuario(text)
  TO epi_manager_runtime;
GRANT EXECUTE ON FUNCTION epi_manager.fn_usuario_pertence_empresa(uuid, uuid)
  TO epi_manager_runtime;
