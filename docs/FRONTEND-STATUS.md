# Status do front-end — EPI Manager

## Estrutura entregue

- React + TypeScript com Vite e Tailwind CSS v4.
- Login com e-mail/senha e seleção de empresa usando os contratos reais da API (`/api/v1/auth/login`, `/api/v1/auth/select-company` e `/api/v1/companies/current`).
- Contexto de sessão em memória; nenhum token é persistido em `localStorage` ou `sessionStorage`.
- Dashboard solicita dados reais de colaboradores, EPIs, estoque, entregas e devoluções; não utiliza dados de demonstração.
- Consultas REST para colaboradores, setores, EPIs, categorias, fornecedores, entregas e devoluções.
- Estoque com consultas de saldos, lotes e movimentos e formulário funcional de recebimento (`POST /api/v1/stock/receipts`).
- Entregas: criação em rascunho, seleção de colaborador/EPI/lote, confirmação com baixa de estoque e cancelamento de rascunhos.
- Devoluções: seleção de entrega confirmada, cálculo do saldo ainda não devolvido, classificação reutilizável/danificado/descarte e confirmação/cancelamento.
- Tela de configuração da URL da API e das informações da sessão.
- Componentes visuais responsivos e arquivo `components.json` preparado para evolução com shadcn/ui.

## Validações deste ambiente

- Node.js disponível: `v22.16.0`.
- Sintaxe de 18 arquivos TypeScript/TSX verificada pela API do compilador TypeScript: sem diagnósticos sintáticos.
- `npm install` não concluiu por indisponibilidade de acesso ao registro npm/DNS neste ambiente.
- Consequentemente, `npm run typecheck`, `npm run build` e testes de navegador ainda não foram executados com dependências reais.
- `package-lock.json` ainda não foi gerado; deve ser criado num ambiente com acesso ao registro npm e incluído no Git antes de habilitar deploy automático.

## Pendências funcionais

- Formulários de criação/edição para colaboradores, setores, EPIs, categorias e fornecedores; telas de detalhe e consulta avançada de entregas/devoluções.
- Renovação/rotatividade de token e recuperação de senha.
- Testes automatizados de componentes e testes HTTP integrados com o Back-End.

O estado atual é uma interface funcional inicial para autenticação, consulta e recebimento de estoque, mas não deve ser apresentada como versão de produção completa.
