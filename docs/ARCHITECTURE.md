# Arquitetura — EPI Manager

## Estado atual

- Banco PostgreSQL Supabase em `sa-east-1`.
- Domínio de negócio no schema não exposto `epi_manager`.
- 17 tabelas com RLS forçado e políticas por empresa.
- 28 triggers de integridade, 34 políticas RLS e 17 funções internas no schema `epi_manager`.
- Spring Boot 4.2.0 / Java 21: API inicial de autenticação, contexto multiempresa, setores e colaboradores.
- Vercel: projeto `epi-manager-web` reservado para o front-end Vite; ainda sem código publicado.

## Limites de confiança

1. React fala exclusivamente com a API Spring Boot.
2. O Spring Boot valida a senha, emite e valida JWT e aplica autorização.
3. A conexão da API usa `epi_manager_app`, que executa `SET ROLE epi_manager_runtime` em cada conexão criada pelo pool.
4. `epi_manager_runtime` não tem `BYPASSRLS`, não pode criar objetos e não pode apagar ou alterar o ledger histórico.
5. A API define `app.empresa_id` e `app.usuario_id` via `set_config(..., true)` dentro de transações para que RLS aplique o escopo do tenant.
6. O front-end nunca recebe senha do banco, `service_role`, chave JWT de assinatura ou credenciais administrativas.

## Fluxo de autenticação

- Login consulta função restrita `fn_autenticar_usuario`, compara BCrypt no servidor e retorna um token transitório `COMPANY_SELECTION` sem tenant.
- A seleção da empresa chama `fn_perfil_usuario_empresa`; somente um vínculo ativo permite emitir o `ACCESS` com `tenant_id` e perfil.
- O filtro de autorização aceita tokens `ACCESS` nas rotas protegidas e limita o token transitório à rota de seleção.
- Access tokens duram 15 minutos; tokens de seleção duram 3 minutos. Não há refresh token nesta etapa.

## Próximos módulos

1. Cadastro de empresa e primeiro administrador com transação de onboarding.
2. Gestão de usuários, setores e colaboradores.
3. Catálogo EPI, categorias e fornecedores.
4. Estoque por lote, entradas e ajustes.
5. Entregas e devoluções, integradas aos triggers e ledger.
6. Relatórios, notificações, PDF e auditoria.
7. Front-end React com sessão segura.
