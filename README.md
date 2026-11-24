# EPI Manager

Sistema web para gerenciamento de Equipamentos de Proteção Individual (EPIs), com arquitetura multiempresa.

> **Status:** desenvolvimento ativo. O banco Supabase está provisionado e protegido. A API Java/Spring Boot e o frontend React estão em implementação; ainda não há publicação de produção.

## Arquitetura

- **Frontend:** React, TypeScript, Vite, Tailwind CSS e shadcn/ui.
- **Backend:** Java 21, Spring Boot, Spring Security, JWT, Spring Data JPA e Flyway.
- **Banco:** PostgreSQL 17 gerenciado pelo Supabase.
- **Hospedagem planejada:** frontend na Vercel; API Java em serviço compatível com contêineres.

O navegador consome somente a API REST. Credenciais administrativas do Supabase e a senha JDBC nunca devem ser incluídas no frontend ou versionadas.

## Módulos planejados

- Autenticação, usuários e seleção de empresa
- Empresas e setores
- Colaboradores
- Categorias, catálogo de EPIs e fornecedores
- Estoque por lote e movimentações
- Entregas, devoluções e histórico
- Alertas, relatórios e auditoria

## Estrutura do projeto

```text
backend/     API Java / Spring Boot
frontend/    Aplicação React / Vite
database/    Migrações e verificações PostgreSQL
docs/        Arquitetura, segurança e contratos
.github/     CI
```

## Segurança e regras de negócio

- Isolamento multiempresa com Row Level Security (RLS).
- Papel JDBC da aplicação separado de credenciais administrativas.
- Estoque, entregas e devoluções executados em transações.
- Ledger de movimentações e auditoria protegidos contra exclusão pelo papel de runtime.
- Segredos fornecidos exclusivamente por variáveis de ambiente.
- Dados pessoais devem ter acesso restrito e tratamento compatível com a LGPD.

## Estado da validação

Os testes transacionais de estoque, entrega e devolução foram executados no PostgreSQL em transações revertidas. A compilação integral Java/React e os deploys ainda precisam ser concluídos em ambiente com acesso às dependências.

## Documentação original

O escopo acadêmico inicial foi elaborado com base no documento “Documento de Requisitos — Sistema de Gestão de EPI”, utilizado na Avaliação Prática 2: Modelagem de Sistemas. A implementação atual amplia esse escopo com autenticação, multiempresa, trilha de auditoria e controles de segurança.

## Próximas etapas

- [ ] Versionar a aplicação completa neste repositório.
- [ ] Executar build e testes automatizados em CI.
- [ ] Configurar as variáveis de ambiente de produção.
- [ ] Publicar API e frontend em ambientes separados.
- [ ] Executar homologação ponta a ponta.

**Licença:** ainda não definida.
