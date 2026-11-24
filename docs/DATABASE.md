# Modelo de dados — EPI Manager

## Localização e acesso

As tabelas de domínio ficam no schema PostgreSQL `epi_manager`, separado do schema `public`. O schema foi configurado como interno: `anon`, `authenticated` e `service_role` não possuem `USAGE` nele. O papel `epi_manager_runtime` é o único papel de aplicação com acesso concedido ao schema.

As 17 tabelas têm Row Level Security (RLS) habilitado e `FORCE ROW LEVEL SECURITY` ativo. As políticas limitam registros ao `app.empresa_id` definido pela API e permitem a exceção de administrador global por meio de contexto definido exclusivamente no backend.

## Tabelas

| Tabela | Responsabilidade |
|---|---|
| `empresas` | Cadastro e estado das empresas clientes; CNPJ numérico ou alfanumérico com dígitos verificadores válidos. |
| `usuarios` | Identidades globais, e-mail único e hash de senha. |
| `usuarios_empresas` | Vínculo usuário/empresa e perfil dentro da empresa. |
| `setores` | Setores organizacionais de cada empresa. |
| `colaboradores` | Funcionários que recebem EPIs; CPF é armazenado como hash e dado criptografado, quando necessário. |
| `categorias_epi` | Classificação dos equipamentos por empresa. |
| `epis` | Catálogo de EPIs, código, CA, validade do CA, unidade, estoque mínimo e vida útil. |
| `fornecedores` | Fornecedores cadastrados por empresa; CNPJ opcional com suporte a formato alfanumérico. |
| `lotes_estoque` | Quantidade inicial/disponível e datas de fabricação/validade por lote. |
| `movimentacoes_estoque` | Livro de movimentos de entrada, saída, devolução e ajustes. |
| `entregas` | Documento de entrega a um colaborador, com responsável e estado. |
| `itens_entrega` | EPIs, lotes e quantidades entregues; inclui data prevista de substituição. |
| `devolucoes` | Devolução vinculada a uma entrega anterior. |
| `itens_devolucao` | Quantidades devolvidas e condição: reutilizável, danificado ou descarte. |
| `assinaturas` | Evidência de confirmação digital vinculada à entrega/devolução. Não presume assinatura eletrônica qualificada. |
| `notificacoes` | Alertas internos por empresa. |
| `logs_auditoria` | Registro histórico das operações relevantes. |

## Perfis

- `ADMIN_PLATAFORMA`: papel global registrado em `usuarios.papel_global`.
- `ADMIN`: administrador de uma empresa, em `usuarios_empresas.perfil`.
- `ALMOXARIFE`: operação de estoque e movimentações conforme autorização da API.
- `CONSULTA`: acesso de leitura conforme autorização da API.

Um mesmo usuário pode ter associação com mais de uma empresa. A autorização para uma empresa deriva de `usuarios_empresas`, não de um `empresa_id` enviado livremente pelo navegador.

## Integridade multiempresa

As tabelas filhas carregam `empresa_id`. Chaves estrangeiras compostas relacionam, sempre que aplicável, tanto o identificador do registro quanto o `empresa_id`. Exemplos:

- colaborador → setor;
- EPI → categoria;
- lote → EPI e fornecedor;
- entrega → colaborador e usuário responsável;
- item de entrega → entrega, EPI e lote correspondente ao mesmo EPI;
- devolução → entrega e usuário responsável;
- item de devolução → devolução e item de entrega original;
- movimentação → EPI, lote e usuário membro da empresa.

Isso impede que uma linha de uma empresa seja vinculada acidentalmente a um registro de outra empresa.

## Regras operacionais no banco

- Entregas e devoluções começam como `RASCUNHO` e só podem transicionar para `CONFIRMADA` ou `CANCELADA`.
- A confirmação de entrega bloqueia linhas de lote com `FOR UPDATE`, valida EPI ativo, CA válido, validade física do lote e saldo suficiente; em seguida atualiza o saldo e grava movimento de saída na mesma transação.
- A confirmação de devolução exige entrega confirmada, devolve ao estoque somente itens `REUTILIZAVEL`, atualiza o lote e grava movimento de devolução na mesma transação.
- Movimentações, logs de auditoria e evidências de assinatura são históricos append-only para o papel de runtime.
- A quantidade total devolvida não pode exceder a quantidade originalmente entregue. Devoluções canceladas não consomem mais a quantidade que foi reservada por seus itens.
- CA, validade física do lote e data prevista de substituição são campos com significados diferentes.

## Índices e alertas

Os índices existentes foram preservados. Os avisos `unused_index` do advisor de performance foram classificados como informativos: a base está vazia e ainda não há carga de consultas real para medir uso. Não remover índices sem métricas de produção.

## CNPJ alfanumérico

A partir da implantação em julho de 2026, novas inscrições podem usar letras e números nas 12 primeiras posições, mantendo os dois dígitos verificadores numéricos. A base armazena o identificador canônico em 14 caracteres, sem pontuação e em maiúsculas. A função `epi_manager.fn_cnpj_valido` valida formato e dígitos verificadores no PostgreSQL; a API normaliza e valida a mesma regra antes de inserir.
