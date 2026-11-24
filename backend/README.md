# EPI Manager API

API REST inicial do EPI Manager, construída com Java 21 e Spring Boot 4.2.0.

## O que esta primeira entrega implementa

- Autenticação por e-mail e senha com BCrypt.
- Token JWT temporário para seleção de empresa (3 minutos).
- Emissão de token de acesso somente após confirmar no PostgreSQL o vínculo ativo do usuário com a empresa.
- Tokens de acesso de 15 minutos, com `tenant_id` e perfil da associação.
- Cadastro transacional de empresa com primeiro usuário como `ADMIN` (opt-in por configuração).
- Validação de CNPJ numérico e alfanumérico, incluindo dígitos verificadores.
- `GET /api/v1/auth/me`.
- `GET /api/v1/companies/current`, demonstrando o contexto transacional de tenant e as políticas RLS.
- CRUD de categorias de EPI, catálogo de EPIs e fornecedores, com inativação lógica e verificação do tenant em cada transação.
- Recebimentos de estoque com criação de lote e lançamento de entrada atômicos.
- Consulta de lotes, saldos não vencidos/vencidos e histórico de movimentações.
- Entregas em rascunho e confirmação/cancelamento com baixa automática de estoque pelos gatilhos PostgreSQL.
- Devoluções em rascunho e confirmação/cancelamento, com retorno ao saldo apenas dos itens reutilizáveis.
- Health check em `/actuator/health`.
- Documentação OpenAPI e Swagger UI com springdoc 3.2.1, compatível com Spring Boot 4.2.
- Configuração de CORS por lista explícita de origens.
- Conexão com um usuário PostgreSQL dedicado, que assume `epi_manager_runtime` ao abrir cada conexão.

Ainda não foram implementados recuperação de senha, refresh token rotativo, alertas agendados, relatórios, comprovantes PDF nem assinatura formal. Os fluxos de recebimento, entrega e devolução já possuem endpoints iniciais, mas precisam passar por build Maven e testes HTTP ponta a ponta antes de qualquer uso operacional.

## Requisitos

- JDK 21.
- Maven 3.6.3 ou superior (recomenda-se Maven 3.9.x).
- Acesso de rede ao Supabase PostgreSQL pelo Session Pooler.
- Usuário de banco `epi_manager_app`, com associação ao papel `epi_manager_runtime`.

## Preparar o banco para a API

As tabelas ficam no schema privado `epi_manager`. O Spring Boot não usa `anon`, `authenticated`, `service_role` nem a conta administrativa `postgres`.

1. No SQL Editor do Supabase, execute `../database/operations/create_app_login_role.sql`.
2. A senha forte do `epi_manager_app` já está configurada no banco. Guarde o valor originalmente definido no cofre de segredos do host; se ele não estiver disponível, redefina a senha no SQL Editor e armazene o novo valor no cofre. O texto da senha atual não pode ser recuperado do PostgreSQL. Não a coloque no Git.
3. Use os dados de conexão **Session Pooler** do painel Supabase. Configure `DB_URL`, `DB_USERNAME` e `DB_PASSWORD` conforme `backend/.env.example`.
4. Gere uma chave JWT com `openssl rand -base64 48` e configure `JWT_SECRET_BASE64`.
5. Configure `CORS_ALLOWED_ORIGINS` com as origens reais do front-end.

O `connection-init-sql` executa `SET ROLE epi_manager_runtime` em cada conexão física criada pelo HikariCP. O login do banco foi criado como `NOINHERIT`, sem `BYPASSRLS` e sem privilégios de criação de schema/tabelas.

## Executar localmente

```bash
cd backend
cp .env.example .env
# Preencha .env com os valores reais; não o versione.
set -a && source .env && set +a
mvn spring-boot:run
```

No Windows PowerShell, defina as variáveis de ambiente individualmente ou use uma ferramenta local de carregamento de `.env` que não faça commit do arquivo.

## Fluxo de autenticação

1. `POST /api/v1/auth/login` recebe `email` e `password`.
2. A API consulta `epi_manager.fn_autenticar_usuario`, que foi criada como função `SECURITY DEFINER` com execução concedida somente ao papel interno da aplicação. A função retorna apenas a identidade, o hash para comparação no servidor e as empresas às quais a conta pertence.
3. A API valida a senha com BCrypt e emite um token curto `COMPANY_SELECTION`, sem `tenant_id`.
4. `POST /api/v1/auth/select-company` recebe o token temporário e `companyId`. A API consulta `epi_manager.fn_perfil_usuario_empresa` para confirmar que o vínculo está ativo e recuperar o perfil diretamente do banco.
5. Somente então é emitido o token `ACCESS`, com `tenant_id` e `company_profile`.
6. Serviços de negócio devem iniciar transação e chamar `TenantSessionContext.activate(companyId, userId)` antes de consultar tabelas por empresa. Isso define `app.empresa_id` e `app.usuario_id` de forma local à transação; as políticas RLS existentes aplicam o isolamento.

O CNPJ é normalizado para 14 caracteres sem pontuação e em maiúsculas; o banco e a API validam os dígitos verificadores segundo o novo formato da Receita Federal. O front-end deve manter o access token apenas em memória nesta primeira versão. Não armazenar token em `localStorage`. Uma estratégia de refresh e cookie `HttpOnly`, `Secure`, `SameSite` será especificada antes de habilitar sessões persistentes. A documentação Swagger fica protegida em produção; `API_DOCS_PUBLIC=true` deve ser usado apenas no ambiente local de desenvolvimento.

## Endpoints disponíveis

| Método | Endpoint | Acesso |
|---|---|---|
| POST | `/api/v1/auth/register-company` | Público quando `REGISTRATION_ENABLED=true` |
| POST | `/api/v1/auth/login` | Público |
| POST | `/api/v1/auth/select-company` | Token `COMPANY_SELECTION` |
| GET | `/api/v1/auth/me` | Token `ACCESS` |
| GET | `/api/v1/companies/current` | Token `ACCESS` |
| GET/POST/PUT/PATCH | `/api/v1/categories` | Token `ACCESS` + perfil conforme contrato |
| GET/POST/PUT/PATCH | `/api/v1/epis` | Token `ACCESS` + perfil conforme contrato |
| GET/POST/PUT/PATCH | `/api/v1/suppliers` | Token `ACCESS` + perfil conforme contrato |
| POST | `/api/v1/stock/receipts` | ADMIN, ALMOXARIFE |
| GET | `/api/v1/stock/lots`, `/balances`, `/movements` | ADMIN, ALMOXARIFE, CONSULTA |
| GET/POST | `/api/v1/deliveries` | Token `ACCESS` + perfil conforme contrato |
| POST | `/api/v1/deliveries/{id}/confirm`, `/cancel` | ADMIN, ALMOXARIFE |
| GET/POST | `/api/v1/returns` | Token `ACCESS` + perfil conforme contrato |
| POST | `/api/v1/returns/{id}/confirm`, `/cancel` | ADMIN, ALMOXARIFE |
| GET | `/actuator/health` | Público, sem detalhes internos |

Exemplo de login:

```json
{
  "email": "usuario@empresa.com",
  "password": "senha-informada-no-cadastro"
}
```

Exemplo de seleção:

```json
{
  "companyId": "00000000-0000-0000-0000-000000000000"
}
```

## Migrações e Hibernate

O histórico de schema deste ambiente é mantido pelo Supabase. Por isso `spring.flyway.enabled=false` e `spring.jpa.hibernate.ddl-auto=none`. O usuário de runtime não executa DDL. Não ative Flyway nem `ddl-auto=update` sem uma migração coordenada e revisada: isso criaria uma segunda fonte de verdade e poderia alterar tabelas já existentes.

## Verificações

```bash
mvn -B test
mvn -B package
```

O teste unitário de JWT verifica a separação entre token temporário de seleção de empresa e token de acesso com tenant validado. Os cenários principais de banco foram exercitados diretamente no Supabase em transações temporárias revertidas. Ainda faltam testes HTTP ponta a ponta executados com a credencial JDBC da aplicação.
