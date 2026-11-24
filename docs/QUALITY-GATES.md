# Portões de qualidade — EPI Manager

Este documento define critérios objetivos para considerar uma versão pronta para demonstração, homologação ou produção. Marcar um item exige evidência executável, não apenas a existência de código.

## Gate 1 — Repositório e configuração

- [ ] Todo o código-fonte de `backend/`, `frontend/`, `database/`, `docs/` e `.github/` está versionado no repositório remoto.
- [ ] `git status` limpo e histórico de commits revisado.
- [ ] Nenhum `.env`, token, senha, chave privada, dump com dados reais ou credencial aparece no histórico.
- [ ] `.env.example` contém somente nomes e exemplos não secretos.
- [ ] Lockfile npm gerado e versionado; instalação reproduzível com `npm ci`.

## Gate 2 — Build automatizado

- [ ] Front-end: `npm ci` concluído.
- [ ] Front-end: `npm run typecheck` concluído sem erros.
- [ ] Front-end: `npm run build` concluído.
- [ ] Back-end: `mvn --batch-mode --no-transfer-progress verify` concluído.
- [ ] GitHub Actions verde para a revisão candidata.
- [ ] Imagem Docker do back-end construída com sucesso.

## Gate 3 — Segurança e isolamento

- [ ] Login rejeita senha incorreta e conta inativa com resposta genérica.
- [ ] Token de seleção de empresa não acessa endpoints de negócio.
- [ ] Token expirado ou com assinatura/issuer inválido é rejeitado.
- [ ] Usuário sem vínculo ativo não seleciona a empresa.
- [ ] Duas empresas de teste não conseguem ler nem alterar dados uma da outra.
- [ ] Contexto RLS é transacional e não vaza entre conexões reutilizadas do pool.
- [ ] CORS contém somente origens necessárias.
- [ ] Swagger e cadastro público permanecem protegidos/desabilitados por padrão.
- [ ] Segredos estão em cofre de variáveis do host, nunca no Git ou no bundle do navegador.

## Gate 4 — Fluxos funcionais

- [ ] Criar empresa e primeiro usuário no fluxo de onboarding autorizado.
- [ ] Entrar e selecionar uma empresa.
- [ ] Cadastrar, editar, consultar e inativar setor.
- [ ] Cadastrar, editar, consultar e inativar colaborador.
- [ ] Cadastrar categoria, EPI e fornecedor.
- [ ] Receber estoque em lote e validar saldo.
- [ ] Impedir entrega acima do saldo disponível.
- [ ] Confirmar entrega e validar baixa e ledger.
- [ ] Cancelar rascunho sem movimentar estoque.
- [ ] Confirmar devolução reutilizável e danificada com saldos corretos.
- [ ] Impedir devolução acima do limite elegível.
- [ ] Validar lotes vencidos e alertas de estoque mínimo.
- [ ] Validar estados vazios, carregamento, erro de API e confirmação de ações destrutivas na interface.

## Gate 5 — Homologação e apresentação

- [ ] Base isolada com dados fictícios e roteiro repetível.
- [ ] Executar roteiro de `DEMO-ROTEIRO.md` do login à devolução.
- [ ] Conferir responsividade em desktop e celular.
- [ ] Conferir navegação por teclado, labels e mensagens de validação.
- [ ] Registrar evidências (prints, logs de CI e resultados de testes) sem dados pessoais.
- [ ] Apresentar limitações conhecidas sem declarar recursos pendentes como prontos.

## Critérios de liberação

- **Demonstração acadêmica:** Gates 1, 2 e 4 concluídos para os fluxos que serão apresentados; Gate 3 validado nos cenários críticos.
- **Homologação:** todos os Gates 1–5 concluídos em ambiente de teste.
- **Produção:** todos os Gates 1–5 concluídos, revisão de segurança aprovada, backup/restore testado, monitoramento ativo e plano de rollback documentado.
