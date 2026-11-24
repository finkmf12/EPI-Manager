-- APPLIED 2026-11-23 to project mvebibtufpobpvhcrkmg.
-- Cancelled return drafts remain as history but no longer reserve delivered quantity.

CREATE OR REPLACE FUNCTION epi_manager.fn_validar_total_devolvido()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'pg_catalog', 'epi_manager'
AS $function$
DECLARE
  v_quantidade_entregue numeric(12,3);
  v_total_devolvido numeric(12,3);
BEGIN
  SELECT ie.quantidade
    INTO v_quantidade_entregue
  FROM epi_manager.itens_entrega ie
  WHERE ie.id = NEW.item_entrega_id
    AND ie.empresa_id = NEW.empresa_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Item de entrega nao encontrado para esta empresa.';
  END IF;

  SELECT COALESCE(SUM(idv.quantidade), 0)
    INTO v_total_devolvido
  FROM epi_manager.itens_devolucao idv
  JOIN epi_manager.devolucoes d
    ON d.id = idv.devolucao_id
   AND d.empresa_id = idv.empresa_id
  WHERE idv.item_entrega_id = NEW.item_entrega_id
    AND idv.empresa_id = NEW.empresa_id
    AND idv.id IS DISTINCT FROM NEW.id
    AND d.status IN ('RASCUNHO', 'CONFIRMADA');

  IF v_total_devolvido + NEW.quantidade > v_quantidade_entregue THEN
    RAISE EXCEPTION 'Quantidade devolvida excede a quantidade originalmente entregue.';
  END IF;

  RETURN NEW;
END;
$function$;
