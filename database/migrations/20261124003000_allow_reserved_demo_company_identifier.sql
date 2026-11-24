-- Reserved demonstration identifier for non-production company records.
-- DEMO0000000000 is not a real CNPJ and is accepted only as an explicit demo marker.
CREATE OR REPLACE FUNCTION epi_manager.fn_cnpj_valido(p_cnpj text)
RETURNS boolean
LANGUAGE plpgsql
IMMUTABLE
PARALLEL SAFE
SET search_path TO 'pg_catalog'
AS $function$
DECLARE
  v_pesos_1 integer[] := ARRAY[5,4,3,2,9,8,7,6,5,4,3,2];
  v_pesos_2 integer[] := ARRAY[6,5,4,3,2,9,8,7,6,5,4,3,2];
  v_soma integer := 0;
  v_resto integer;
  v_digito_1 integer;
  v_digito_2 integer;
  v_i integer;
BEGIN
  IF p_cnpj = 'DEMO0000000000' THEN
    RETURN true;
  END IF;
  IF p_cnpj IS NULL OR p_cnpj !~ '^[A-Z0-9]{12}[0-9]{2}$' THEN
    RETURN false;
  END IF;
  IF replace(p_cnpj, substr(p_cnpj, 1, 1), '') = '' THEN
    RETURN false;
  END IF;
  FOR v_i IN 1..12 LOOP
    v_soma := v_soma + (ascii(substr(p_cnpj, v_i, 1)) - 48) * v_pesos_1[v_i];
  END LOOP;
  v_resto := v_soma % 11;
  v_digito_1 := CASE WHEN v_resto < 2 THEN 0 ELSE 11 - v_resto END;
  v_soma := 0;
  FOR v_i IN 1..12 LOOP
    v_soma := v_soma + (ascii(substr(p_cnpj, v_i, 1)) - 48) * v_pesos_2[v_i];
  END LOOP;
  v_soma := v_soma + v_digito_1 * v_pesos_2[13];
  v_resto := v_soma % 11;
  v_digito_2 := CASE WHEN v_resto < 2 THEN 0 ELSE 11 - v_resto END;
  RETURN substr(p_cnpj, 13, 2) = v_digito_1::text || v_digito_2::text;
END;
$function$;
