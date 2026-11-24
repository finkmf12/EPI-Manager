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
- Serviço de colaboradores valida a unicidade da matrícula dentro da empresa tanto no cadastro quanto na edição.

## Front-End

- React 19, TypeScript, Vite e Tailwind CSS v4.
- Dashboard, gestão de colaboradores, setores e fornecedores, consultas cadastrais, catálogo de EPIs, estoque, entregas, devoluções, relatórios, notificações, auditoria e configurações.
- Gestão de colaboradores inclui cadastro/edição, validação de matrícula, vínculo com setor, filtros, indicadores e alteração de situação por perfil.
- Gestão de setores inclui cadastro/edição, pesquisa, filtros, contagem de vínculos, validação de nome duplicado na API e inativação/reativação por ADMIN.
- Gestão de fornecedores inclui cadastro/edição, pesquisa, filtros, validação de CNPJ com dígitos verificadores e unicidade por empresa na API, além de inativação/reativação por ADMIN preservando os registros históricos.
- Catálogo de EPIs inclui cadastro/edição/inativação e acompanhamento da validade do CA.
- Emissão de termo de entrega para impressão e alertas operacionais.
- Consulte `docs/FRONTEND-STATUS.md` para o detalhamento por módulo.

## Qualidade e validação

- Pipeline de CI do front-end executa instalação, type-check e build de produção.
- O Catálogo de EPIs e a gestão de colaboradores passaram na etapa de type-check/build em 24/11/2026.
- A execução mais recente de estilos responsivos deve ser consultada no GitHub Actions antes de declarar a etapa totalmente aprovada.
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
