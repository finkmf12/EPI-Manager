# Status de entrega — EPI Manager

## Concluído

- [x] Projeto Supabase criado em São Paulo (`sa-east-1`).
- [x] 17 tabelas no schema privado `epi_manager`.
- [x] RLS forçado nas tabelas; políticas tenant mantidas.
- [x] Papéis `epi_manager_runtime` e `epi_manager_app` separados do usuário administrativo.
- [x] Funções restritas para login, perfil de empresa e validação do vínculo ativo por empresa.
- [x] Contexto multiempresa exige transação Spring e revalida vínculo ativo antes de definir variáveis de sessão RLS.
- [x] Login executa BCrypt também para contas inexistentes, reduzindo diferenças de tempo que poderiam facilitar enumeração.
- [x] Papel de conexão `epi_manager_app` criado com `NOINHERIT`, sem `SUPERUSER`/`BYPASSRLS`, senha configurada no banco e associação a `epi_manager_runtime`; a senha não é incluída no repositório.
- [x] Banco adaptado para CNPJ alfanumérico e dígitos verificadores validados no PostgreSQL.
- [x] Projeto Vercel `epi-manager-web` criado como Vite, ainda sem deploy.
- [x] API Spring Boot 4.2.0 / Java 21 com cadastro inicial transacional (opt-in), login, seleção de empresa, JWT, endpoint `/me`, consulta JPA da empresa atual e documentação Swagger.
- [x] Módulos REST iniciais de setores e colaboradores com escopo multiempresa e autorização por perfil.
- [x] Catálogo REST de categorias, EPIs e fornecedores, com validação de categoria ativa, unidade de medida, estoque mínimo decimal, CNPJ e inativação lógica.
- [x] Recebimentos REST: criação de lote e movimentação `ENTRADA` na mesma transação.
- [x] Consulta REST de lotes, saldos por EPI (disponível/vencido) e ledger de movimentações.
- [x] Entregas REST com criação em rascunho, confirmação, cancelamento e baixa automática via gatilho transacional.
- [x] Devoluções REST com criação em rascunho, confirmação, cancelamento e retorno ao saldo somente de itens reutilizáveis.
- [x] Regras de banco traduzidas para respostas HTTP 409 quando acionadas explicitamente pelos gatilhos.
- [x] CPF não é coletado nem exposto até existir política de criptografia e gestão de chaves.
- [x] Testes unitários de JWT, CNPJ e proteção do contexto multiempresa incluídos.

## Não concluído / bloqueios conhecidos

- [ ] Guardar a senha já configurada do `epi_manager_app` no cofre de segredos do host de back-end quando o host for escolhido.
- [ ] Maven ainda precisa ser executado em um ambiente com dependências Maven acessíveis para validar build/testes completos; o ambiente de trabalho atual não conseguiu resolver o Maven Central.
- [x] Repositório GitHub `finkmf12/EPI-Manager` confirmado; README e `docs/IMPLEMENTATION-STATUS.md` atualizados remotamente. O código-fonte completo ainda precisa ser versionado no remoto.
- [ ] Host do Spring Boot ainda não foi escolhido; Vercel está reservado para o front-end, sem deploy.
- [x] Front-end React + TypeScript + Vite + Tailwind CSS v4 com login/seleção de empresa, dashboard, cadastros, estoque, entregas, devoluções e configurações.
- [x] Workflows GitHub Actions de front-end e back-end adicionados ao repositório remoto e ao pacote local; os gatilhos foram ajustados para executar somente quando os diretórios de código correspondentes forem enviados.
- [x] Roteiro de demonstração acadêmica e portões de qualidade documentados.
- [x] Consulta operacional de saldos, lotes e movimentações; formulário de recebimento conectado ao endpoint REST.
- [x] Fluxos visuais de criação de entregas/devoluções em rascunho, confirmação e cancelamento; seleção de lotes e quantidades respeita os contratos da API.
- [ ] Build do front-end ainda precisa ser executado em ambiente com acesso ao registro npm; o lockfile ainda precisa ser gerado. A tentativa de instalação local expirou por indisponibilidade de acesso ao registro npm. Foi adicionada uma pipeline GitHub Actions para type-check e build. A tentativa local de `npm install --package-lock-only --offline` não pôde gerar o lockfile porque o cache npm não contém as dependências. A execução inicial do workflow no GitHub falhou antes do build porque o diretório `frontend/` ainda não existe no repositório remoto. A tentativa local de `tsc --noEmit` foi bloqueada pela ausência das definições `@types/node` e `vite/client` (dependências não instaladas).
- [ ] Cadastro público está implementado, mas desativado por padrão; habilitar somente após configurar rate limit/WAF no gateway de produção.
- [ ] Recuperação de senha, refresh token rotativo, revogação imediata e rate limit distribuído para login/cadastro ainda não foram implementados.
- [ ] Alertas agendados, relatórios, comprovantes PDF e assinatura formal ainda não têm endpoints REST.
- [ ] Build Maven e testes HTTP ponta a ponta ainda não foram executados neste ambiente; a validação completa deve ocorrer no CI com Maven e acesso às dependências.
- [ ] Testes automatizados de interface ainda não foram adicionados; criação/edição dos demais módulos, renovação de sessão e fluxos completos de entrega/devolução no front-end continuam pendentes.

Não usar o sistema em produção até completar os itens pendentes, executar `mvn verify`, validar os endpoints HTTP contra o Supabase com a credencial JDBC da aplicação e realizar revisão final de segurança.


## Material de apresentação

- `docs/DEMO-ROTEIRO.md` contém uma sequência de demonstração, conceitos técnicos e perguntas prováveis da banca.
- `docs/QUALITY-GATES.md` define critérios verificáveis para demonstração, homologação e produção.
- `.github/workflows/frontend-ci.yml` executa instalação, type-check e build do front-end em push/PR.
