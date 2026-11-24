# EPI Manager

Sistema web multiempresa para gestão de Equipamentos de Proteção Individual (EPIs). Centraliza cadastros, estoque por lote, entregas, devoluções, notificações, auditoria e relatórios operacionais.

## Aplicação publicada

- **Front-end:** [https://epimanager.vercel.app](https://epimanager.vercel.app)
- **API:** [https://epimanager-academy-cda9.vercel.app](https://epimanager-academy-cda9.vercel.app)
- **Repositório:** [finkmf12/EPI-Manager](https://github.com/finkmf12/EPI-Manager)

Os endereços acima identificam as implantações configuradas. A disponibilidade de cada fluxo deve ser confirmada por testes de homologação; status de deploy READY, isoladamente, não comprova que todas as operações funcionam.

## Arquitetura e tecnologias

| Camada | Tecnologias |
| --- | --- |
| Front-end | React 19, TypeScript, Vite 8, Tailwind CSS v4 e React Router |
| Back-end | Java 21, Spring Boot 4.2, Spring Security, JWT e Spring Data |
| Banco de dados | PostgreSQL no Supabase, schema privado `epi_manager` |
| Hospedagem | Vercel para interface e API |
| Qualidade | GitHub Actions para verificações de front-end e back-end |

O navegador comunica-se com a API Spring Boot. As regras de negócio e a autorização ficam no servidor; o PostgreSQL mantém a integridade e o isolamento dos dados por empresa.

## Funcionalidades disponíveis no projeto

- Autenticação e seleção de empresa.
- Dashboard com indicadores operacionais.
- Cadastros de colaboradores, setores, categorias, EPIs e fornecedores.
- Recebimento de estoque por lote, consulta de saldos e histórico de movimentações.
- Fluxos de entrega e devolução, incluindo rascunho, confirmação e cancelamento.
- Comprovante/termo imprimível de entrega.
- Notificações operacionais e trilha de auditoria.
- Relatórios com filtros e exportação CSV, além de impressão pelo navegador.
- Interface responsiva e estrutura de instalação PWA.

Consulte a documentação de status e os resultados de testes antes de considerar qualquer fluxo homologado em produção.

## Executar localmente

### Front-end

```bash
cd frontend
cp .env.example .env.local
npm install
npm run build
npm run dev
```

Configure `VITE_API_BASE_URL` no arquivo `.env.local` com a URL da API. Para desenvolvimento local, o valor padrão do exemplo é `http://localhost:8080`.

### Back-end

```bash
cd backend
cp .env.example .env
mvn --batch-mode verify
```

Preencha as variáveis de ambiente no arquivo local, sem versioná-lo. A aplicação precisa da conexão JDBC dedicada `epi_manager_app` e de uma chave JWT mantida em variável segura.

## Segurança

- O banco usa o schema privado `epi_manager`, com Row-Level Security (RLS) e políticas de isolamento por empresa.
- A API valida o vínculo do usuário com a empresa e define o contexto do tenant dentro da transação.
- O papel de conexão da aplicação não deve possuir privilégios de superusuário nem bypass de RLS.
- Não coloque arquivos `.env`, senhas, chaves JWT, tokens ou dados reais de colaboradores no Git.
- O front-end não deve receber credenciais administrativas do Supabase.

## Documentação

- [Arquitetura](docs/ARCHITECTURE.md)
- [Implantação](docs/DEPLOYMENT.md)
- [Regras de negócio (RN01–RN14)](docs/REGRAS-DE-NEGOCIO.md)
- [Auditoria](docs/AUDITORIA.md)
- [Contrato da API](docs/API-CONTRACT.md)
- [Roteiro de demonstração](docs/DEMO-ROTEIRO.md)
- [Status da entrega](docs/DELIVERY-STATUS.md)
- [Resultados de testes](docs/TEST-RESULTS.md)
- [Revisão de segurança](docs/SECURITY-REVIEW.md)

## Importante

O projeto está em evolução. Antes de uma utilização real, valide os fluxos completos, os controles de acesso, a configuração dos segredos, a recuperação de falhas e os procedimentos de backup. Não use dados pessoais reais em demonstrações acadêmicas.
