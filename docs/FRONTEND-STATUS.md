# Status do front-end — EPI Manager

Última revisão: 2026-11-24

## Estrutura e tecnologias

- React 19, TypeScript, Vite e Tailwind CSS v4.
- Integração REST com a API Java/Spring Boot.
- Sessão mantida em memória; tokens não são gravados em `localStorage` ou `sessionStorage`.
- Interface responsiva com navegação por módulos e escopo da empresa selecionada.

## Módulos implementados

- **Autenticação:** login, seleção de empresa e cadastro inicial conforme contratos disponíveis na API.
- **Dashboard:** indicadores e gráficos alimentados por consultas reais de colaboradores, EPIs, estoque, entregas, devoluções e auditoria.
- **Colaboradores:** cadastro, edição, pesquisa por dados pessoais/profissionais, filtros por situação, vínculo com setor e indicadores de ativos, afastados e inativos. ADMIN pode alterar a situação para ativo, afastado ou inativo; ALMOXARIFE pode cadastrar e editar.
- **Setores:** cadastro, edição, pesquisa, filtros por situação, contagem de colaboradores vinculados e inativação/reativação com preservação do histórico. ADMIN e ALMOXARIFE podem cadastrar/editar; somente ADMIN altera a situação. A API valida nomes duplicados dentro da empresa.
- **Fornecedores:** cadastro e edição de dados comerciais, validação de CNPJ (incluindo formato alfanumérico), pesquisa, filtros por situação e inativação/reativação com preservação dos lotes e recebimentos históricos. ADMIN e ALMOXARIFE cadastram/editam; somente ADMIN altera a situação.
- **Categorias:** tela de consulta conectada à API.
- **Catálogo de EPIs:** cadastro, edição, pesquisa, filtros por situação e inativação preservando o histórico. Exibe validade do CA e classifica os registros como regular, em atenção ou vencido.
- **Estoque:** consulta de saldos, lotes e movimentações; registro de recebimento com criação de lote.
- **Entregas:** criação de rascunho, seleção de colaborador/EPI/lote, confirmação e cancelamento de rascunhos; emissão de termo imprimível para entrega confirmada.
- **Devoluções:** seleção de entrega confirmada, controle de quantidades pendentes, classificação da condição e confirmação/cancelamento.
- **Relatórios:** consultas operacionais, filtros por período, exportação CSV e impressão.
- **Notificações:** alertas calculados para CA, lotes próximos do vencimento/vencidos, estoque abaixo do mínimo e entregas em rascunho.
- **Auditoria:** consulta do histórico de operações conforme permissão do perfil.
- **Configurações:** consulta da sessão e configuração do endereço da API.

## Regras de interface e segurança

- Operações de escrita são exibidas conforme o perfil e também protegidas pela autorização da API.
- Os dados operacionais são consultados com token de acesso e escopo da empresa ativa.
- A interface não apresenta registros fictícios quando a API não retorna dados.
- Inativação é utilizada em vez de exclusão física nos cadastros com histórico.
- Alertas são informativos e não alteram estoque ou registros automaticamente.
- Matrícula duplicada é verificada na tela antes do envio; a API e a restrição de banco continuam sendo a autoridade final para integridade concorrente.
- Afastados e inativos não são carregados como elegíveis para novas entregas.

## Validação automatizada

- Workflow `.github/workflows/frontend-ci.yml` executa instalação de dependências, verificação TypeScript e build de produção.
- Catálogo de EPIs, integração de rota e estilos responsivos passaram no GitHub Actions em 24/11/2026.
- A nova tela de Colaboradores, sua integração de rota, os estilos responsivos e a classificação visual do status AFASTADO passaram no GitHub Actions em 24/11/2026.
- A aprovação do build confirma compilação e tipagem; não substitui testes E2E, homologação visual ou validação de fluxos com usuários reais.

## Próximas melhorias

- Formulário completo de manutenção para categorias.
- Testes automatizados de componentes e testes HTTP integrados.
- Testes E2E dos fluxos críticos, incluindo autenticação multiempresa, recebimento, entrega e devolução.
- Melhorias de acessibilidade e validação de formulários.

## Gestão de categorias

A tela `/app/categories` foi implementada com consulta autenticada à API, cadastro e edição de categorias, pesquisa por nome/descrição, filtro por situação, indicadores de ativos/inativos e EPIs classificados, contagem de EPIs vinculados e inativação/reativação conforme perfil. A tela preserva o histórico e não utiliza dados fictícios. A validação de compilação e tipos está em execução no CI após a integração da rota.
