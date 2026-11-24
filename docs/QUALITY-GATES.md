# Portões de qualidade — EPI Manager

Este documento define critérios objetivos para considerar uma versão pronta para demonstração, homologação ou produção. Marcar um item exige evidência executável, não apenas a existência de código.

## Gate 1 — Repositório e configuração

- [ ] Todo o código-fonte de `backend/`, `frontend/`, `database/`, `docs/` e `.github/` está versionado no repositório remoto.
- [ ] Histórico de commits revisado e árvore de trabalho limpa.
- [ ] Nenhum `.env`, token, senha, chave privada ou dado real aparece no histórico.
- [ ] `.env.example` contém somente nomes e exemplos não secretos.
- [ ] Lockfile npm gerado e versionado; instalação reproduzível com `npm ci`.

## Gate 2 — Build automatizado

- [ ] Front-end: `npm ci` concluído.
- [ ] Front-end: `npm run typecheck` sem erros.
- [ ] Front-end: `npm run build` concluído.
- [ ] Back-end: `mvn --batch-mode --no-transfer-progress verify` concluído.
- [ ] GitHub Actions verde para a revisão candidata.
- [ ] Imagem Docker do back-end construída com sucesso.

## Gate 3 — Segurança e isolamento

- [ ] Login rejeita credenciais inválidas com resposta genérica.
- [ ] Token de seleção de empresa não acessa endpoints de negócio.
- [ ] Token expirado, assinatura ou issuer inválido é rejeitado.
- [ ] Usuário sem vínculo ativo não seleciona a empresa.
- [ ] Duas empresas de teste não conseguem ler nem alterar dados uma da outra.
- [ ] Contexto RLS é transacional e não vaza entre conexões do pool.
- [ ] CORS contém somente origens necessárias.
- [ ] Swagger e cadastro público permanecem protegidos/desabilitados por padrão.
- [ ] Segredos ficam no cofre do host, nunca no Git ou no bundle do navegador.

## Gate 4 — Fluxos funcionais

- [ ] Criar empresa e primeiro usuário no onboarding autorizado.
- [ ] Login e seleção de empresa.
- [ ] CRUD de setores e colaboradores.
- [ ] CRUD de categorias, EPIs e fornecedores.
- [ ] Recebimento por lote e validação de saldo.
- [ ] Bloqueio de entrega acima do saldo disponível.
- [ ] Confirmação de entrega com baixa e ledger.
- [ ] Cancelamento de rascunho sem movimentação.
- [ ] Devolução reutilizável e danificada com saldos corretos.
- [ ] Bloqueio de devolução acima do limite elegível.
- [ ] Validação de lotes vencidos e estoque mínimo.
- [ ] Estados vazios, carregamento, erros e confirmação de ações destrutivas na interface.

## Gate 5 — Homologação e apresentação

- [ ] Base isolada com dados fictícios.
- [ ] Roteiro de `DEMO-ROTEIRO.md` executado do login à devolução.
- [ ] Responsividade desktop/celular verificada.
- [ ] Teclado, labels e mensagens de validação verificados.
- [ ] Evidências de CI e testes registradas sem dados pessoais.
- [ ] Limitações conhecidas declaradas sem apresentar pendências como prontas.

## Critérios de liberação

- **Demonstração acadêmica:** Gates 1, 2 e 4 concluídos para os fluxos apresentados; Gate 3 validado nos cenários críticos.
- **Homologação:** Gates 1–5 concluídos em ambiente de teste.
- **Produção:** Gates 1–5 concluídos, revisão de segurança aprovada, backup/restore testado, monitoramento ativo e rollback documentado.
