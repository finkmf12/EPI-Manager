# EPI Manager

Sistema web multiempresa para gestão de Equipamentos de Proteção Individual (EPIs), com cadastro de colaboradores, setores, catálogo, fornecedores, estoque por lote, entregas e devoluções.

## Arquitetura

```text
frontend/       React + TypeScript + Vite + Tailwind CSS v4
backend/        Java 21 + Spring Boot REST API
 database/      Migrações SQL e verificações do PostgreSQL/Supabase
 docs/           Arquitetura, segurança, API, testes e entrega
.github/        CI do front-end e back-end
```

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

Consulte `docs/DELIVERY-STATUS.md` para distinguir o que está implementado, o que foi validado e o que ainda bloqueia a produção. A presença de uma funcionalidade no código não significa que ela já foi homologada em ambiente publicado.

## Executar localmente

### Front-end

```bash
cd frontend
cp .env.example .env.local
npm install
npm run build
npm run dev
```

Configure `VITE_API_URL` no `.env.local` com a URL da API. O navegador comunica-se somente com o back-end; não use credenciais administrativas do Supabase no front-end.

### Back-end

```bash
cd backend
cp .env.example .env
mvn --batch-mode verify
```

Preencha as variáveis de ambiente no arquivo local, sem versioná-lo. A aplicação precisa da conexão JDBC dedicada `epi_manager_app` e da chave JWT mantida em um cofre de segredos.

## Segurança

O back-end usa o papel dedicado `epi_manager_app`, sem `SUPERUSER` ou `BYPASSRLS`, e define o contexto da empresa dentro da transação após validar o vínculo do usuário. Não colocar `.env`, senhas, chaves JWT, tokens ou dados reais de colaboradores no Git.

## GitHub e implantação

Repositório: [finkmf12/EPI-Manager](https://github.com/finkmf12/EPI-Manager).

O projeto Vercel `epi-manager-web` foi criado e configurado para Vite, com diretório raiz `frontend` e saída `dist`; ainda não há deploy homologado. O código-fonte completo precisa ser enviado ao repositório remoto antes de conectar o deploy automático.


## Documentação do projeto

- [Regras de Negócio (RN01–RN14)](docs/REGRAS-DE-NEGOCIO.md) — restrições e condições que o sistema deve respeitar.
- [Auditoria do sistema](docs/AUDITORIA.md) — eventos registrados, segurança, permissões e limitações da trilha de auditoria.

## Estado da entrega

Leia, nesta ordem:
1. `docs/DELIVERY-STATUS.md`
2. `docs/TEST-RESULTS.md`
3. `docs/SECURITY-REVIEW.md`
4. `docs/DEPLOYMENT.md`

**Não usar em produção** até concluir os testes de build, integração HTTP, segurança, configuração dos segredos e homologação dos fluxos completos.
