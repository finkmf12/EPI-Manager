# Segurança e contexto multiempresa

## Limite de confiança

O navegador não acessa diretamente as tabelas internas. O fluxo esperado é:

```text
React (browser)
  -> HTTPS / REST
Spring Boot + Spring Security
  -> valida JWT e permissões no servidor
  -> valida vínculo e perfil da empresa em função restrita do banco
  -> abre transação PostgreSQL e define contexto local
PostgreSQL / schema epi_manager
  -> FORCE ROW LEVEL SECURITY + tenant_scope_runtime
```

## Contexto PostgreSQL

As políticas RLS usam as configurações locais de transação `app.usuario_id`, `app.empresa_id`, `app.admin_plataforma` e `app.onboarding`. A API define-as somente após validar a identidade e a associação. `TenantSessionContext` exige uma transação Spring ativa, confirma novamente o vínculo por meio de `fn_usuario_pertence_empresa` e então aplica `app.usuario_id` e `app.empresa_id` com `set_config(..., true)`; `app.admin_plataforma` permanece falso e `app.onboarding` só fica verdadeiro na transação de cadastro inicial.

O argumento `true` torna a configuração local à transação, evitando que uma empresa permaneça associada a uma conexão devolvida ao pool.

## Papéis do PostgreSQL

- `epi_manager_runtime`: papel interno sem `LOGIN`, sem `SUPERUSER`, sem `BYPASSRLS`; tem acesso ao schema privado, mas não pode apagar histórico nem executar DDL.
- `epi_manager_app`: login dedicado criado com `NOINHERIT`, sem `SUPERUSER` e sem `BYPASSRLS`; é membro de `epi_manager_runtime` e só deve atuar após `SET ROLE epi_manager_runtime`.
- A senha do `epi_manager_app` ainda precisa ser definida por canal administrativo seguro. Não há senha incluída neste pacote.

O Hikari executa `SET ROLE epi_manager_runtime` ao abrir cada conexão física. A API não usa `postgres`, `anon`, `authenticated` ou `service_role` como usuário JDBC.

## Funções SECURITY DEFINER

As funções `fn_autenticar_usuario`, `fn_usuario_pertence_empresa` e `fn_perfil_usuario_empresa` são `SECURITY DEFINER`, têm `search_path` fixo (`pg_catalog, epi_manager`) e execução concedida somente ao `epi_manager_runtime`. A função de autenticação retorna o hash de senha somente ao servidor da API para comparação BCrypt. `anon`, `authenticated`, `service_role` e `PUBLIC` não possuem execução.

## Autenticação atual

- Login: consulta a função restrita, compara BCrypt no servidor (incluindo hash fictício para contas inexistentes) e emite token `COMPANY_SELECTION` de 3 minutos, sem `tenant_id`.
- Seleção: confirma vínculo ativo e perfil diretamente no banco antes de emitir `ACCESS` de 15 minutos.
- O conversor de autenticação só autoriza o token transitório na rota de seleção e aceita tokens `ACCESS` nas demais rotas protegidas.
- Tokens ficam apenas em memória no front-end nesta primeira fase; não usar `localStorage`.

## Pendências antes de produção

- Definir senha forte do `epi_manager_app` e guardá-la como secret no host do back-end.
- Configurar limite distribuído de tentativas de login e proteção anti-automação/captcha para cadastro público; o limitador em memória da API é apenas complementar.
- O cadastro da empresa e do primeiro usuário como `ADMIN` já está implementado em uma transação, mas permanece desativado por padrão até existir proteção de borda.
- Implementar verificação de e-mail, recuperação de senha, refresh token rotativo e revogação de sessão.
- Confirmar estratégia de cookies `HttpOnly`, `Secure`, `SameSite` antes de habilitar sessões persistentes.
- Validar todos os endpoints com testes de integração PostgreSQL, incluindo tentativa de alternar `tenant_id` e acessar dados de outra empresa.
- Revisar controles de dados pessoais e LGPD antes de inserir cadastros reais.

## Migrações e DDL

O histórico de schema deste ambiente é mantido pelo Supabase. Flyway está incluído no classpath para futura avaliação, mas sua execução automática está desativada; o `ddl-auto` do Hibernate também está desativado. Migrações futuras devem ser revisadas e aplicadas por canal administrativo separado, nunca pelo papel de runtime.
