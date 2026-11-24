# Estado de implementação — EPI Manager

Última revisão: 2026-11-24

## Infraestrutura

- Banco PostgreSQL hospedado no Supabase, com schema de domínio `epi_manager`.
- Isolamento multiempresa implementado com contexto de tenant e políticas de Row Level Security.
- Acesso da API realizado por credenciais de runtime; segredos não devem ser versionados.
- Migrações e scripts de verificação de banco versionados em `database/`.

## Back-End

- Java 21 e Spring Boot.
- Módulos de autenticação, empresas, setores, colaboradores, catálogo de EPIs, fornecedores, estoque, entregas, devoluções e auditoria.
- Endpoints REST documentados por OpenAPI.
- Regras de integridade de estoque e rastreabilidade apoiadas pelo banco de dados.
- Controle de acesso por perfil e escopo da empresa.

## Front-End

- React 19, TypeScript, Vite e Tailwind CSS v4.
- Dashboard, consultas cadastrais, catálogo de EPIs com cadastro/edição/inativação, estoque, entregas, devoluções, relatórios, notificações, auditoria e configurações.
- Emissão de termo de entrega para impressão.
- Alertas de conformidade de CA e validade de lotes, estoque mínimo e entregas pendentes.
- Consulte `docs/FRONTEND-STATUS.md` para o detalhamento por módulo.

## Qualidade e validação

- Pipeline de CI do front-end executa instalação, type-check e build de produção.
- O Catálogo de EPIs, sua integração de rota e estilos responsivos passaram no GitHub Actions em 24/11/2026.
- O pipeline de back-end também está versionado; consultar a execução mais recente antes de declarar uma nova validação.
- Verificações do banco e roteiro de demonstração estão documentados em `database/verification/` e `docs/DEMO-ROTEIRO.md`.

## Pendências antes de produção

- Executar testes E2E completos em ambiente controlado.
- Homologar autenticação, troca de empresa e permissões com contas de cada perfil.
- Validar os fluxos operacionais com dados de teste e cenários de erro.
- Revisar monitoramento, backup, recuperação e política de retenção.
- Confirmar a arquitetura de hospedagem da API Java e os segredos de produção.
- Realizar revisão final de segurança e acessibilidade.

## Materiais de apresentação

- `docs/DEMO-ROTEIRO.md`: roteiro acadêmico de demonstração.
- `docs/QUALITY-GATES.md`: critérios de qualidade.
- `docs/REGRAS-DE-NEGOCIO.md`: regras de negócio.
- `docs/ARCHITECTURE.md` e `docs/diagramas-uml.md`: arquitetura e diagramas.

## Segurança

- Nunca adicionar arquivos `.env`, senhas, tokens, chaves Supabase ou credenciais JDBC ao Git.
- Nunca expor a chave `service_role` no navegador.
- A aprovação do CI não equivale a homologação ou autorização para uso em produção.
