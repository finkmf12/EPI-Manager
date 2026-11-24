# Front-end — EPI Manager

Aplicação React + TypeScript preparada para consumir exclusivamente a API REST Spring Boot.

## Tecnologias fixadas

- Node.js `>=22.12.0`
- React `19.3.1` / React DOM `19.3.1`
- Vite `8.3.8`
- TypeScript `7.0.2`
- Tailwind CSS `4.3.5` com `@tailwindcss/vite`
- React Router DOM `7.18.3`
- Lucide React `1.78.0`

As versões estão fixadas em `package.json`. O lockfile deve ser gerado e versionado no ambiente com acesso ao registro npm antes de ativar deploy automático.

## Executar localmente

```bash
cp .env.example .env.local
npm install
npm run dev
```

Configure `VITE_API_BASE_URL` com a URL base da API Spring Boot. Por padrão, o front-end utiliza `http://localhost:8080`.

## Validar e gerar build

```bash
npm run typecheck
npm run build
npm run preview
```

## Segurança

- O navegador conversa apenas com a API Spring Boot.
- Não instalar Supabase JS para acessar o schema privado `epi_manager`.
- Não definir `service_role`, `DB_PASSWORD`, `JWT_SECRET_BASE64` ou qualquer segredo em variáveis `VITE_*`.
- O token de seleção de empresa e o token de acesso ficam somente em memória; atualizar a página encerra a sessão neste estágio.
- A API deve permitir CORS apenas para os domínios reais de desenvolvimento/produção.
- A tela não usa dados fictícios: listas vazias e falhas de API são mostradas explicitamente.

## Estado da interface

Implementados no esqueleto visual:

- Login e seleção de empresa pela API;
- Painel com indicadores carregados dos endpoints reais;
- Consulta de colaboradores, setores, EPIs, categorias, fornecedores, entregas e devoluções;
- Consulta de saldos, lotes e movimentações de estoque;
- Formulário de recebimento conectado a `POST /api/v1/stock/receipts`;
- Criação, confirmação e cancelamento de entregas;
- Criação, confirmação e cancelamento de devoluções, com saldo restante por item e classificação da condição física;
- Configurações de sessão e conexão.

Formulários de criação/edição das demais entidades, telas de detalhe/consulta avançada, recuperação/renovação de sessão e testes automatizados de interface ainda precisam ser desenvolvidos.
