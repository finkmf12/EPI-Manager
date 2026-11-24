# Arquitetura — EPI Manager

## Visão geral

O EPI Manager utiliza arquitetura em camadas, com interface web, API REST e banco de dados relacional.

```text
Navegador / PWA
      |
      | HTTPS + JSON
      v
Front-end React + TypeScript
      |
      | API REST + JWT
      v
Back-end Java 21 / Spring Boot
      |
      | JDBC + transações
      v
PostgreSQL (Supabase)
  schema epi_manager
  RLS + integridade referencial
```

## Responsabilidades por camada

### Front-end

- Apresentar telas, formulários, tabelas, filtros e indicadores.
- Manter o estado de navegação e a sessão do usuário.
- Consumir exclusivamente a API Spring Boot para operações de negócio.
- Exibir validações e mensagens retornadas pela API.
- Oferecer interface responsiva e recursos de instalação PWA.

### Back-end

- Autenticar usuários e emitir/validar tokens JWT.
- Validar vínculo do usuário com a empresa selecionada.
- Aplicar autorização por perfil.
- Validar regras de negócio e executar operações transacionais.
- Expor endpoints REST e documentação OpenAPI.

### Banco de dados

- Persistir empresas, usuários, colaboradores, EPIs, lotes e movimentações.
- Aplicar integridade referencial, constraints e triggers.
- Isolar registros por empresa com Row-Level Security (RLS).
- Preservar o histórico de movimentações e auditoria.

## Isolamento multiempresa

1. O usuário informa suas credenciais; a API valida a conta no servidor.
2. O usuário seleciona uma empresa à qual possui vínculo.
3. A API confirma que o vínculo está ativo e emite o token de acesso associado à empresa e ao perfil.
4. Nas operações protegidas, a API define o contexto de usuário e empresa dentro da transação.
5. O PostgreSQL aplica as políticas RLS para limitar os registros acessíveis.

A interface não é uma fronteira de segurança. Toda autorização deve ser validada novamente no servidor e reforçada pelo banco.

## Autenticação e sessão

O fluxo de autenticação utiliza JWT. O token transitório de seleção de empresa é distinto do token de acesso às rotas protegidas. Os tempos de expiração e as permissões devem ser conferidos na configuração vigente do back-end.

Recursos como recuperação de senha, refresh token rotativo e revogação imediata não devem ser considerados disponíveis sem implementação e testes específicos.

## Módulos funcionais

- Autenticação e seleção de empresa.
- Dashboard e notificações operacionais.
- Colaboradores e setores.
- Categorias, catálogo de EPIs e fornecedores.
- Estoque por lote, recebimentos e movimentações.
- Entregas, devoluções e comprovante imprimível.
- Relatórios e auditoria.

## Implantação

- Front-end e back-end publicados em projetos Vercel separados.
- PostgreSQL hospedado no Supabase.
- Integração contínua por GitHub Actions.

Consulte [DEPLOYMENT.md](DEPLOYMENT.md) para os endereços e variáveis de ambiente. A implantação READY não equivale à homologação funcional ou autorização para uso em produção.
