# EPI Manager

Sistema web multiempresa para gestão de Equipamentos de Proteção Individual (EPIs), com cadastro de colaboradores, setores, catálogo, fornecedores, estoque por lote, entregas e devoluções.

## Arquitetura

- **Front-end:** React 19, TypeScript, Vite 8, Tailwind CSS v4 e React Router.
- **Back-end:** Java 21, Spring Boot 4.2, Spring Security, JWT, Spring Data JPA/JDBC.
- **Banco:** PostgreSQL 17 no Supabase, schema privado `epi_manager`, RLS e isolamento por empresa.
- **Hospedagem prevista:** Vercel para o front-end; serviço Java em host compatível com contêiner.

## Funcionalidades implementadas no código

- Autenticação e seleção de empresa.
- Dashboard operacional.
- Cadastros de colaboradores, setores, categorias, EPIs e fornecedores.
- Recebimento de estoque por lote e consulta de saldos/movimentações.
- Entregas e devoluções com rascunho, confirmação e cancelamento.
- API REST documentada com OpenAPI/Swagger.

A presença de uma funcionalidade no código não significa que ela já foi homologada em ambiente publicado. Consulte `docs/DELIVERY-STATUS.md`, `docs/TEST-RESULTS.md` e `docs/SECURITY-REVIEW.md` para ver o que está implementado, validado e pendente.

## Executar localmente

### Front-end

```bash
cd frontend
cp .env.example .env.local
npm install
npm run build
npm run dev
```

Configure `VITE_API_URL` no `.env.local`. O navegador comunica-se somente com o back-end; não use credenciais administrativas do Supabase no front-end.

### Back-end

```bash
cd backend
cp .env.example .env
mvn --batch-mode verify
```

Preencha as variáveis de ambiente localmente, sem versioná-las. A aplicação precisa da conexão JDBC dedicada `epi_manager_app` e da chave JWT mantida em um cofre de segredos.

## Segurança

O back-end usa o papel dedicado `epi_manager_app`, sem `SUPERUSER` ou `BYPASSRLS`, e define o contexto da empresa dentro da transação após validar o vínculo do usuário. Não commitar `.env`, senhas, chaves JWT, tokens ou dados reais de colaboradores.

## GitHub e implantação

Repositório: [finkmf12/EPI-Manager](https://github.com/finkmf12/EPI-Manager).

O projeto Vercel `epi-manager-web` foi criado e configurado para Vite, com diretório raiz `frontend` e saída `dist`; ainda não há deploy homologado. O código-fonte completo precisa ser enviado ao repositório remoto antes de conectar o deploy automático.

## Apresentação acadêmica

Consulte [docs/DEMO-ROTEIRO.md](docs/DEMO-ROTEIRO.md) para uma sequência de demonstração, conceitos técnicos e perguntas prováveis da banca.

**Não usar em produção** até concluir os testes de build, integração HTTP, segurança, configuração dos segredos e homologação dos fluxos completos.
