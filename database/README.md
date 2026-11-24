# Histórico de migrações

As migrações abaixo foram aplicadas com sucesso ao projeto Supabase EPI Manager em 23/11/2026. As versões correspondem ao histórico retornado pelo Supabase.

| Versão | Nome | Objetivo |
|---|---|---|
| `20261123234023` | `move_domain_to_private_schema_and_harden_access` | Mover as 17 tabelas e 13 funções originais para `epi_manager`, preservar gatilhos/políticas, forçar RLS e reduzir privilégios. |
| `20261123234350` | `exclude_cancelled_returns_from_return_limits` | Não contar itens históricos de devoluções canceladas no limite de quantidade devolvida. |
| `20261123234839` | `secure_auth_lookup_and_company_membership` | Criar consulta restrita de autenticação, unicidade de e-mail sem diferenciar maiúsculas/minúsculas e validação do vínculo ativo. |
| `20261123234941` | `secure_user_company_profile_lookup` | Consultar o perfil ativo de um usuário em uma empresa. |
| `20261123235006` | `create_dedicated_backend_login_role` | Criar o login PostgreSQL sem privilégios administrativos para o Spring Boot. |
| `20261123235502` | `support_alphanumeric_cnpj` | Aceitar o formato CNPJ alfanumérico de 14 posições. |
| `20261123235637` | `validate_cnpj_check_digits` | Validar os dígitos verificadores do CNPJ no PostgreSQL. |
| `20261123235844` | `reject_repeated_character_cnpj` | Reforçar a rejeição de CNPJs com todos os caracteres repetidos. |

O schema de negócio está em `epi_manager`, não exposto pela Data API. Todas as 17 tabelas têm RLS habilitado e forçado. O papel `epi_manager_runtime` não tem `BYPASSRLS`, não pode apagar histórico e não possui privilégios para alterar o ledger de estoque, auditoria ou evidências de assinatura.

**Atenção:** estes arquivos são o registro das mudanças aplicadas sobre o baseline já existente. O DDL histórico que criou originalmente as 17 tabelas não foi exportado nesta etapa; portanto, não executar apenas estes arquivos para provisionar um projeto Supabase vazio. A primeira migração também não é idempotente e não deve ser executada novamente no projeto atual.

O papel `epi_manager_app` existe com senha configurada no PostgreSQL. O texto da senha não é recuperável por consulta; mantenha o valor original no cofre de segredos do host ou redefina-o no SQL Editor se necessário. Não registrar a senha neste repositório.


Para reexecutar o cenário temporário de recebimento, entrega e devolução, use `verification/verify_stock_delivery_return.sql` no SQL Editor com uma conexão administrativa. O script troca para `epi_manager_runtime` durante as operações e termina obrigatoriamente em `ROLLBACK`; não o altere para `COMMIT`.
