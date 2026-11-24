CREATE OR REPLACE FUNCTION epi_manager.fn_perfil_usuario_empresa(
  p_usuario_id uuid,
  p_empresa_id uuid
)
RETURNS varchar
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'pg_catalog', 'epi_manager'
AS $function$
  SELECT ue.perfil
  FROM epi_manager.usuarios_empresas ue
  JOIN epi_manager.usuarios u ON u.id = ue.usuario_id
  JOIN epi_manager.empresas e ON e.id = ue.empresa_id
  WHERE ue.usuario_id = p_usuario_id
    AND ue.empresa_id = p_empresa_id
    AND ue.ativo = true
    AND u.status = 'ATIVO'
    AND e.status = 'ATIVA'
  LIMIT 1;
$function$;

REVOKE ALL ON FUNCTION epi_manager.fn_perfil_usuario_empresa(uuid, uuid)
  FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION epi_manager.fn_perfil_usuario_empresa(uuid, uuid)
  TO epi_manager_runtime;
