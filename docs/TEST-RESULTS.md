# Resultados de validação — 23/11/2026

## Auditoria estrutural após migrações

| Verificação | Resultado |
|---|---:|
| Tabelas no schema `epi_manager` | 17 |
| Tabelas remanescentes no schema `public` | 0 |
| Políticas RLS preservadas | 34 |
| Gatilhos preservados | 28 |
| Funções internas | 13 |
| Tabelas sem RLS forçado | 0 |
| Funções ainda referenciando `public.` | 0 |
| Papéis `anon`, `authenticated` ou `service_role` com `USAGE` em `epi_manager` | Nenhum |
| Papel `epi_manager_runtime` com `DELETE` geral | Não |
| Runtime com `UPDATE` em ledger de movimentações | Não |
| Runtime com `DELETE` em auditoria | Não |

## Teste de isolamento multiempresa

Em uma transação de teste, duas empresas foram criadas temporariamente. Após executar como `epi_manager_runtime` com `app.empresa_id` configurado para a Empresa A, a consulta retornou:

- linhas visíveis para a Empresa A: 1;
- linhas da Empresa B visíveis: 0.

A transação foi revertida (`ROLLBACK`). Nenhuma empresa de teste permaneceu no banco.

## Teste do ciclo de estoque

Cenário temporário:

1. Saldo inicial de lote: 10.
2. Entrada de 10 registrada no ledger.
3. Entrega confirmada de 2: o banco baixou o saldo para 8 e registrou saída de 2.
4. Devolução reutilizável de 1: o banco aumentou o saldo para 9 e registrou devolução de 1.
5. Devolução danificada de 1: não retornou ao saldo.

Resultado final observado dentro da transação: saldo 9; saída total 2; devolução total 1. A transação foi revertida.

## Correção adicional: devoluções canceladas

A função `fn_validar_total_devolvido` foi ajustada para contar somente itens de devoluções em `RASCUNHO` ou `CONFIRMADA`. Itens históricos de devoluções `CANCELADA` não bloqueiam uma nova devolução.

Teste temporário:

- devolução de 2 unidades criada e cancelada;
- nova devolução das mesmas 2 unidades criada e confirmada;
- tentativa de devolver uma unidade excedente rejeitada pelo banco;
- saldo final esperado observado: 4 (lote iniciou com 4, saiu 2 e retornou 2).

A transação foi revertida. Nenhum registro de teste permaneceu.

## Supabase Advisors

Após as alterações, os advisors de segurança e saúde retornaram `lints: []`.

## Limitações do que foi testado

- Não foi feito deploy do Spring Boot ou do front-end.
- Não foi executado um teste de conexão JDBC com o login `epi_manager_app`; o papel já está configurado no PostgreSQL, mas ainda precisa ser testado a partir do host da API.
- Não foi executado um teste HTTP direto contra a Data API; a proteção verificada nesta etapa foi por grants, schema privado e RLS.
- O banco permanece sem registros reais.


## Cadastro e autenticação multiempresa

- O onboarding foi exercitado em uma transação com papel de runtime: inserção da empresa, criação do usuário e associação `ADMIN` foram aceitas pelas políticas RLS. O rollback removeu todos os dados temporários.
- `fn_autenticar_usuario` foi testada com e-mail em maiúsculas e retornou a associação ativa e o perfil `ADMIN`.
- A função de vínculo ativo retorna `false` após a associação ser desativada.
- A validação PostgreSQL aceita `11222333000181` e `12ABC34501DE35`, e rejeita `12ABC34501DE36` e `00000000000000`.

## Verificações locais de código

- `javac` compilou `CnpjValidator.java` e um smoke test executou seis casos: PASSOU.
- `pom.xml` passou pela leitura XML: válido.
- `application.yml` e `application-test.yml` passaram pela leitura YAML: válidos.
- A execução Maven completa (`mvn verify`) não foi realizada neste ambiente: Maven não está instalado e o ambiente não conseguiu resolver o Maven Central. A pipeline GitHub Actions foi adicionada para executar `mvn verify` quando o código for enviado ao repositório.

## Validação adicional do catálogo (23/11/2026)

Em uma única transação temporária, executada como `epi_manager_runtime` com tenant definido, foram criados:

- uma categoria de EPI;
- um EPI com unidade `UN` e estoque mínimo decimal `2.500`;
- um fornecedor com CNPJ alfanumérico válido `12ABC34501DE35`.

A tentativa de cadastrar o CNPJ `12ABC34501DE36` foi rejeitada pela constraint de validação do PostgreSQL. O resultado confirmou 1 categoria, 1 EPI, 1 fornecedor e validação positiva do CNPJ correto. A transação terminou com `ROLLBACK`.

## Papel JDBC dedicado

A consulta de `pg_roles` confirmou que `epi_manager_app`:

- permite login;
- não é superusuário;
- não possui `BYPASSRLS`;
- usa `NOINHERIT`;
- tem senha configurada;
- é membro de `epi_manager_runtime`.

A configuração da senha foi confirmada sem ler nem expor seu valor. O teste `SET ROLE` não foi executado pelo conector administrativo, pois esse contexto não representa o login `epi_manager_app`; a associação de papéis foi confirmada diretamente em `pg_auth_members`.


## Fluxos de API implementados (23/11/2026)

Foram adicionados serviços REST para recebimentos, lotes, saldos, movimentos, entregas e devoluções. Os contratos seguem as tabelas e constraints lidas diretamente do schema `epi_manager`. Os serviços definem o tenant no escopo da transação, não aceitam `empresaId` nem `usuarioId` vindos do cliente e restringem operações de escrita a `ADMIN`/`ALMOXARIFE`.

- Recebimento: cria lote e movimento `ENTRADA` atomicamente.
- Entrega: cria cabeçalho e itens em `RASCUNHO`; a confirmação executa os gatilhos do banco para verificar CA, validade do lote e saldo e lançar `SAIDA`.
- Devolução: exige entrega confirmada; a confirmação devolve apenas itens `REUTILIZAVEL` ao saldo.
- Cancelamentos: somente documentos em `RASCUNHO` podem ser cancelados.
- Erros explícitos `P0001` gerados pelas regras de negócio do PostgreSQL são traduzidos para conflito HTTP 409.

Foi adicionado teste unitário para a tradução de exceções `P0001`. O teste de integração completo do Spring Boot ainda depende da execução de `mvn verify`; Maven não está instalado neste ambiente e a resolução do host Maven Central falhou por indisponibilidade de DNS.

## Fluxos de API e consultas do estoque (23/11/2026)

Foi executado um cenário transacional temporário seguindo a sequência de SQL que os serviços REST utilizam:

1. Recebimento de 8 unidades com criação de lote e movimento `ENTRADA`.
2. Entrega de 3 unidades e confirmação do documento, com baixa automática.
3. Devolução confirmada de 2 unidades `REUTILIZAVEL`, com retorno ao saldo.
4. Segunda devolução confirmada de 1 unidade `DANIFICADO`, sem retorno ao saldo.

Resultado observado antes do `ROLLBACK`: saldo final 7; 1 entrada; saída total 3; devolução lançada no ledger 2; duas devoluções confirmadas. O teste passou e todos os registros foram revertidos.

Também foram executadas as consultas SQL de lotes, saldos agregados e histórico de movimentações com tenant ativo. Cada consulta retornou o registro esperado. A transação foi revertida.

A camada Java inclui testes unitários para converter exceções PostgreSQL `P0001` em `409 Conflict`; a execução do JUnit depende do `mvn verify`, ainda não disponível neste ambiente. Uma varredura de parsing com `javac` não encontrou erros de sintaxe, mas a compilação completa não pode ser considerada aprovada enquanto as dependências Spring/Jakarta não forem resolvidas pelo Maven.
