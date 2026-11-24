# Hospedagem — EPI Manager

## Front-end — Vercel

- Projeto: `epi-manager-web`
- ID: `prj_7xU7x0ajeucNvzRA2Ui6S5WyxqHE`
- Time: `Academy` (`academy-cda9`)
- Framework: Vite
- Diretório raiz: `frontend`
- Instalação: `npm install`
- Build: `npm run build`
- Saída: `dist`
- Projeto confirmado pela API da Vercel; ainda sem deploy, domínio, repositório ou variáveis configuradas.
- O código Vite/React está em `frontend/`. Antes do primeiro deploy: gerar/versionar `package-lock.json`, definir `VITE_API_BASE_URL` com a URL pública do Back-End e configurar `CORS_ALLOWED_ORIGINS` na API com o domínio Vercel definitivo.

O projeto Vercel está protegido por Vercel Authentication para deployments sem domínio customizado. Não há código de front-end publicado ainda.

## Back-end — Spring Boot

A API Java deve ser publicada num host de back-end que execute um serviço Spring Boot persistente ou um container compatível. O projeto ainda não foi publicado e o provedor não foi escolhido.

Antes de provisionar o host:

1. Guardar a senha de `epi_manager_app` no cofre de secrets do host. Se o valor original não estiver disponível, redefina uma nova senha no SQL Editor e armazene-a diretamente no cofre; o banco não permite recuperar o texto da senha atual.
2. Guardar `DB_URL`, `DB_USERNAME`, `DB_PASSWORD` e `JWT_SECRET_BASE64` no cofre de secrets do host.
3. Configurar `DB_USERNAME` no formato `epi_manager_app.<project-ref>` ao usar o Session Pooler; copiar host e porta diretamente do diálogo Connect do Supabase, sem derivar o endereço pela região.
4. Configurar `CORS_ALLOWED_ORIGINS` com o domínio real do front-end.
5. Configurar probes de health em `/actuator/health`.
6. Executar build e testes com Maven em ambiente com acesso ao Maven Central.

## GitHub

O repositório dedicado `epi-manager` ainda não existe. A conexão GitHub disponível neste ambiente permite ler e gravar arquivos em repositórios existentes, mas não expõe a ação de criação de repositório. O pacote pode ser enviado a um novo repositório após sua criação.

Não conectar o projeto Vercel a um repositório de outro projeto.
