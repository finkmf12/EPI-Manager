-- Teste transacional do fluxo de recebimento, entrega e devolução.
-- Executar no SQL Editor como role administrativa. O script termina em ROLLBACK.
-- Nunca substituir o ROLLBACK final por COMMIT.

BEGIN;

INSERT INTO epi_manager.empresas (id, razao_social, nome_fantasia, cnpj)
VALUES ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
        'Empresa Teste API Estoque', 'Teste API Estoque', '11222333000181');

INSERT INTO epi_manager.usuarios (id, nome, email, senha_hash)
VALUES ('cccccccc-cccc-4ccc-8ccc-cccccccccccc',
        'Usuário Teste API', 'teste.api.fluxo@epi-manager.invalid', 'hash-nao-utilizavel');

INSERT INTO epi_manager.usuarios_empresas (empresa_id, usuario_id, perfil)
VALUES ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
        'cccccccc-cccc-4ccc-8ccc-cccccccccccc', 'ADMIN');

SET LOCAL ROLE epi_manager_runtime;

SELECT
  set_config('app.empresa_id', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', true),
  set_config('app.usuario_id', 'cccccccc-cccc-4ccc-8ccc-cccccccccccc', true),
  set_config('app.admin_plataforma', 'false', true),
  set_config('app.onboarding', 'false', true);

INSERT INTO epi_manager.colaboradores
  (id, empresa_id, matricula, nome, status)
VALUES ('dddddddd-dddd-4ddd-8ddd-dddddddddddd',
        'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'API-001',
        'Colaborador de Teste', 'ATIVO');

INSERT INTO epi_manager.epis
  (id, empresa_id, codigo, nome, unidade_medida, estoque_minimo)
VALUES ('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
        'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'API-CAP-001',
        'Capacete Teste', 'UN', 2.000);

-- Equivale ao POST /stock/receipts.
INSERT INTO epi_manager.lotes_estoque
  (id, empresa_id, epi_id, codigo_lote, quantidade_inicial,
   quantidade_disponivel, custo_unitario)
VALUES ('ffffffff-ffff-4fff-8fff-ffffffffffff',
        'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
        'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
        'API-LOTE-001', 8.000, 8.000, 24.5000);

INSERT INTO epi_manager.movimentacoes_estoque
  (id, empresa_id, epi_id, lote_id, usuario_id, tipo, quantidade,
   origem_tipo, origem_id, observacao)
VALUES ('99999999-9999-4999-8999-999999999999',
        'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
        'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
        'ffffffff-ffff-4fff-8fff-ffffffffffff',
        'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
        'ENTRADA', 8.000, 'COMPRA', NULL, 'Recebimento temporário de teste');

-- Equivale ao POST /deliveries e POST /deliveries/{id}/confirm.
INSERT INTO epi_manager.entregas
  (id, empresa_id, colaborador_id, responsavel_usuario_id,
   status, data_entrega, observacao)
VALUES ('11111111-1111-4111-8111-111111111111',
        'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
        'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
        'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
        'RASCUNHO', CURRENT_DATE, 'Teste do fluxo REST');

INSERT INTO epi_manager.itens_entrega
  (id, empresa_id, entrega_id, epi_id, lote_id, quantidade)
VALUES ('12121212-1212-4212-8212-121212121212',
        'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
        '11111111-1111-4111-8111-111111111111',
        'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
        'ffffffff-ffff-4fff-8fff-ffffffffffff', 3.000);

UPDATE epi_manager.entregas
SET status = 'CONFIRMADA'
WHERE id = '11111111-1111-4111-8111-111111111111'
  AND empresa_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
  AND status = 'RASCUNHO';

-- Primeira devolução: 2 reutilizáveis.
INSERT INTO epi_manager.devolucoes
  (id, empresa_id, entrega_id, responsavel_usuario_id, status, data_devolucao)
VALUES ('22222222-2222-4222-8222-222222222222',
        'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
        '11111111-1111-4111-8111-111111111111',
        'cccccccc-cccc-4ccc-8ccc-cccccccccccc', 'RASCUNHO', CURRENT_DATE);

INSERT INTO epi_manager.itens_devolucao
  (id, empresa_id, devolucao_id, item_entrega_id, quantidade, condicao)
VALUES ('23232323-2323-4323-8323-232323232323',
        'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
        '22222222-2222-4222-8222-222222222222',
        '12121212-1212-4212-8212-121212121212', 2.000, 'REUTILIZAVEL');

UPDATE epi_manager.devolucoes
SET status = 'CONFIRMADA'
WHERE id = '22222222-2222-4222-8222-222222222222'
  AND empresa_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
  AND status = 'RASCUNHO';

-- Segunda devolução: 1 danificado; não aumenta o saldo.
INSERT INTO epi_manager.devolucoes
  (id, empresa_id, entrega_id, responsavel_usuario_id, status, data_devolucao)
VALUES ('33333333-3333-4333-8333-333333333333',
        'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
        '11111111-1111-4111-8111-111111111111',
        'cccccccc-cccc-4ccc-8ccc-cccccccccccc', 'RASCUNHO', CURRENT_DATE);

INSERT INTO epi_manager.itens_devolucao
  (id, empresa_id, devolucao_id, item_entrega_id, quantidade, condicao)
VALUES ('34343434-3434-4434-8434-343434343434',
        'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
        '33333333-3333-4333-8333-333333333333',
        '12121212-1212-4212-8212-121212121212', 1.000, 'DANIFICADO');

UPDATE epi_manager.devolucoes
SET status = 'CONFIRMADA'
WHERE id = '33333333-3333-4333-8333-333333333333'
  AND empresa_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
  AND status = 'RASCUNHO';

DO $assert$
DECLARE
  v_balance numeric(12,3);
  v_entries numeric(12,3);
  v_exits numeric(12,3);
  v_returns numeric(12,3);
BEGIN
  SELECT quantidade_disponivel INTO v_balance
  FROM epi_manager.lotes_estoque
  WHERE id = 'ffffffff-ffff-4fff-8fff-ffffffffffff';

  SELECT COALESCE(SUM(quantidade), 0) INTO v_entries
  FROM epi_manager.movimentacoes_estoque
  WHERE lote_id = 'ffffffff-ffff-4fff-8fff-ffffffffffff' AND tipo = 'ENTRADA';

  SELECT COALESCE(SUM(quantidade), 0) INTO v_exits
  FROM epi_manager.movimentacoes_estoque
  WHERE lote_id = 'ffffffff-ffff-4fff-8fff-ffffffffffff' AND tipo = 'SAIDA';

  SELECT COALESCE(SUM(quantidade), 0) INTO v_returns
  FROM epi_manager.movimentacoes_estoque
  WHERE lote_id = 'ffffffff-ffff-4fff-8fff-ffffffffffff' AND tipo = 'DEVOLUCAO';

  IF v_balance <> 7.000 OR v_entries <> 8.000 OR v_exits <> 3.000 OR v_returns <> 2.000 THEN
    RAISE EXCEPTION 'Falha no teste de estoque: saldo %, entrada %, saída %, devolução %',
      v_balance, v_entries, v_exits, v_returns;
  END IF;
END;
$assert$;

SELECT
  (SELECT quantidade_disponivel FROM epi_manager.lotes_estoque
   WHERE id = 'ffffffff-ffff-4fff-8fff-ffffffffffff') AS saldo_final_esperado_7,
  (SELECT COALESCE(SUM(quantidade), 0) FROM epi_manager.movimentacoes_estoque
   WHERE lote_id = 'ffffffff-ffff-4fff-8fff-ffffffffffff' AND tipo = 'SAIDA') AS saida_esperada_3,
  (SELECT COALESCE(SUM(quantidade), 0) FROM epi_manager.movimentacoes_estoque
   WHERE lote_id = 'ffffffff-ffff-4fff-8fff-ffffffffffff' AND tipo = 'DEVOLUCAO') AS retorno_esperado_2,
  'PASSOU' AS resultado;

ROLLBACK;
