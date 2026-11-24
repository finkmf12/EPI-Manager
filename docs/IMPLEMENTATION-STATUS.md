# Estado de implementação — EPI Manager

Última revisão: 2026-11-24

## Infraestrutura confirmada

- Projeto Supabase `EPI Manager`, região `sa-east-1`, PostgreSQL 17.12, estado `ACTIVE_HEALTHY`.
- Schema de domínio isolado em `epi_manager`.
- 17 tabelas, 34 políticas RLS e 28 gatilhos.
- RLS forçado nas tabelas de domínio.
- Migrações registradas no Supabase: 8.
- Advisors de segurança e saúde sem alertas.
- Nenhum dado de teste persistente.

## Fluxos verificados no banco

Teste executado dentro de transação com rollback:

1. Entrada de 8 unidades no lote.
2. Entrega confirmada de 3 unidades.
3. Devolução confirmada de 2 unidades reutilizáveis.
4. Devolução confirmada de 1 unidade danificada.
5. Saldo final esperado: 7 unidades.
6. Movimentos registrados no ledger: entrada 8, saída 3 e devolução 2.

O cenário passou e foi revertido integralmente ao final.

## Aplicação

O pacote de desenvolvimento contém:

- API Java 21 / Spring Boot, com módulos de autenticação, empresas, setores, colaboradores, catálogo, fornecedores, estoque, entregas e devoluções.
- Frontend React / TypeScript / Vite com telas de login, dashboard, cadastros, estoque, entregas e devoluções.
- Documentação de arquitetura, segurança, contratos e implantação.
- Migrações incrementais e scripts de verificação do banco.

## Pendências que impedem produção

- Executar `mvn test` e `mvn package` em ambiente com Maven e acesso ao repositório de dependências.
- Executar `npm ci`, `npm run typecheck` e `npm run build` com lockfile gerado.
- Revisar e validar onboarding multiempresa e autenticação ponta a ponta com credenciais de runtime.
- Publicar a API Java em serviço de contêineres e configurar secrets fora do Git.
- Conectar o diretório `frontend` à Vercel somente depois de o código completo estar versionado.
- Realizar testes E2E e homologação com dados de teste controlados.

## Materiais de qualidade e apresentação

- `docs/DEMO-ROTEIRO.md`: roteiro acadêmico de demonstração e perguntas para a banca.
- `docs/QUALITY-GATES.md`: critérios objetivos para demonstração, homologação e produção.
- `.github/workflows/frontend-ci.yml`: pipeline para instalação, type-check e build do front-end.

## Regras de segurança

- Não adicionar `.env`, tokens, senhas, chaves Supabase ou credenciais JDBC ao Git.
- Não usar a chave `service_role` no navegador.
- Não liberar produção antes de concluir as pendências acima.
