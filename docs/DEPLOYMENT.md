# Implantação — EPI Manager

## Ambientes publicados

Os projetos abaixo estão conectados ao repositório `finkmf12/EPI-Manager`, branch `main`.

| Componente | Projeto Vercel | Endereço principal | Estado verificado |
| --- | --- | --- | --- |
| Front-end | `epi-manager-frontend` | [https://epimanager.vercel.app](https://epimanager.vercel.app) | Production deployment READY |
| Back-end | `epimanager` | [https://epimanager-academy-cda9.vercel.app](https://epimanager-academy-cda9.vercel.app) | Production deployment READY |

O status READY informa que a implantação foi concluída pela Vercel. Ele não substitui testes HTTP, autenticação, acesso ao banco ou homologação dos fluxos.

## Front-end — Vercel

- Framework: Vite.
- Diretório raiz: `frontend`.
- Comando de instalação: `npm install`.
- Comando de build: `npm run build`.
- Diretório de saída: `dist`.
- Variável necessária: `VITE_API_BASE_URL`, apontando para a URL pública do Back-end.

A variável `VITE_API_BASE_URL` é incorporada durante o build. Depois de alterá-la no painel da Vercel, é necessário criar uma nova implantação do front-end.

## Back-end — Vercel

- Projeto: `epimanager`.
- Tecnologia: Java 21 / Spring Boot 4.2.
- Implantação baseada no contêiner configurado no repositório.
- Região observada: `gru1`.

Variáveis de ambiente necessárias:

- `DB_URL`
- `DB_USERNAME`
- `DB_PASSWORD`
- `JWT_SECRET_BASE64`
- `JWT_ISSUER`
- `CORS_ALLOWED_ORIGINS`
- `PORT`

Não registre valores secretos neste documento, em commits ou em capturas de tela públicas. Configure `CORS_ALLOWED_ORIGINS` com as origens exatas do front-end; não use curingas em produção.

## Banco de dados — Supabase

- Banco PostgreSQL hospedado na região de São Paulo.
- Schema de aplicação: `epi_manager`.
- Conexão da API com o papel dedicado `epi_manager_app`.
- RLS habilitado e forçado nas tabelas aplicáveis.
- O contexto da empresa deve ser definido dentro da transação antes das consultas protegidas.

Use os dados de conexão fornecidos pelo painel do Supabase. Não derive host, porta ou credenciais por suposição.

## Processo de publicação

1. Enviar as alterações revisadas para a branch `main`.
2. Acompanhar os workflows do GitHub Actions.
3. Acompanhar a implantação correspondente na Vercel.
4. Confirmar o estado READY e o commit publicado.
5. Executar testes de saúde, autenticação e operações principais.
6. Verificar logs e corrigir erros antes de considerar a versão homologada.

## Diagnóstico rápido

- **Erro de conexão no navegador:** conferir `VITE_API_BASE_URL` e publicar novamente o front-end.
- **Erro de CORS:** conferir a origem exata acessada pelo navegador em `CORS_ALLOWED_ORIGINS` e fazer redeploy do back-end.
- **Erro de banco:** verificar as variáveis JDBC, credenciais e disponibilidade do Supabase sem expor valores secretos.
- **Deploy READY, mas fluxo falha:** consultar logs recentes da aplicação e testar o endpoint envolvido; READY não significa que a aplicação foi integralmente homologada.

## Segurança operacional

Nunca publique senhas, tokens, chaves privadas ou dados reais de colaboradores. Restrinja o acesso ao painel Vercel e Supabase e mantenha um procedimento de backup e recuperação antes de utilizar dados reais.
