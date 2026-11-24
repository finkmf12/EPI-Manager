# Status de entrega — EPI Manager

Última revisão: 24/11/2026.

Este documento separa funcionalidades existentes no código, verificações automatizadas e homologação funcional. Uma implantação com estado READY significa que a Vercel concluiu o deploy; não comprova, por si só, que todos os fluxos foram testados.

## Infraestrutura confirmada

- [x] Banco PostgreSQL no Supabase, schema privado `epi_manager`.
- [x] Row-Level Security (RLS) habilitado/forçado nas tabelas aplicáveis.
- [x] Papel dedicado `epi_manager_app`, sem privilégios de superusuário ou bypass de RLS.
- [x] API Java 21 / Spring Boot publicada no projeto Vercel `epimanager`.
- [x] Front-end React / TypeScript publicado no projeto Vercel `epi-manager-frontend`.
- [x] Domínio principal do front-end: `https://epimanager.vercel.app`.
- [x] Endereço de produção da API configurado no front-end por `VITE_API_BASE_URL`.
- [x] Origem principal do front-end configurada em `CORS_ALLOWED_ORIGINS`.
- [x] GitHub Actions com workflows separados para front-end e back-end.

## Funcionalidades implementadas

- [x] Autenticação, seleção de empresa e autorização por perfil.
- [x] Dashboard operacional com indicadores e movimentações.
- [x] Cadastro e gestão de colaboradores e setores.
- [x] Cadastro e gestão de categorias, EPIs e fornecedores.
- [x] Recebimento de estoque por lote.
- [x] Consulta de saldos, lotes e movimentações, com filtros operacionais.
- [x] Entregas com rascunho, confirmação, cancelamento e baixa de estoque.
- [x] Devoluções com rascunho, confirmação, cancelamento e retorno de itens aptos.
- [x] Termo/comprovante de entrega preparado para impressão.
- [x] Notificações operacionais derivadas dos dados disponíveis na API.
- [x] Relatórios operacionais com filtros, exportação CSV e impressão pelo navegador.
- [x] Trilha de auditoria.
- [x] Estrutura PWA com manifesto, ícones e service worker.
- [x] Regras de negócio RN01–RN14 documentadas.
- [x] Documentação de arquitetura, implantação, API, segurança e roteiro de demonstração.

## Verificações automatizadas observadas

- [x] Workflow `frontend-ci` concluído com sucesso nas alterações recentes de estoque e filtros.
- [x] Workflow `backend-ci` concluído com sucesso nas alterações recentes de categorias.
- [x] Deploy de produção do front-end em estado READY após a atualização da documentação.
- [x] Deploy de produção do back-end em estado READY após a atualização da documentação.

Os workflows executam as etapas configuradas em seus arquivos YAML. Consulte o histórico do GitHub Actions para os detalhes de cada execução.

## Homologação funcional ainda necessária

- [ ] Testar login e seleção de empresa no domínio principal em navegador real.
- [ ] Validar criação, edição, inativação e reativação dos cadastros.
- [ ] Validar recebimento, saldo, entrega, confirmação, devolução e cancelamento ponta a ponta.
- [ ] Conferir permissões por perfil e isolamento entre duas empresas de teste.
- [ ] Validar relatórios, exportação CSV, impressão do termo e trilha de auditoria com dados fictícios.
- [ ] Testar instalação e atualização PWA em Android, iOS e desktop.
- [ ] Revisar acessibilidade, mensagens de erro, estados vazios e comportamento em telas pequenas.
- [ ] Definir e testar rotina de backup e recuperação do banco.

## Limitações e itens não confirmados

- Recuperação de senha, refresh token rotativo e revogação imediata de sessões não devem ser considerados disponíveis sem implementação e teste específicos.
- Notificações atuais são operacionais dentro da aplicação; não equivalem a push notifications ou alertas agendados.
- Impressão pelo navegador não equivale a geração de PDF assinado digitalmente.
- Exportação CSV não equivale a exportação Excel nativa.
- A existência de endpoints e telas não substitui testes integrados de todos os cenários.

## Critério para uso real

Antes de utilizar dados pessoais ou operar em uma empresa real, concluir a homologação acima, revisar os segredos e permissões, confirmar backup/recuperação e executar testes de segurança e integração em ambiente controlado. Para a apresentação acadêmica, utilizar exclusivamente dados fictícios.
