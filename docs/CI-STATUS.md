# Estado da integração contínua — 24/11/2026

## Diagnóstico das primeiras execuções

As duas primeiras execuções foram disparadas quando os workflows foram adicionados ao repositório. Ambas falharam antes de executar compilação ou testes, porque o repositório remoto ainda contém documentação e workflows, mas não contém os diretórios de código do pacote local.

| Workflow | Resultado | Causa observada |
|---|---|---|
| `frontend-ci` | Falhou antes da instalação | Diretório `frontend/` ausente no checkout remoto; `npm install` nem chegou a iniciar. |
| `backend-ci` | Falhou na configuração do cache Maven | Nenhum `pom.xml` foi encontrado no checkout remoto; Maven não chegou a executar. |

## Correções aplicadas

- Os workflows agora são acionados somente por alterações nos diretórios `frontend/` e `backend/`, respectivamente.
- O workflow Java foi atualizado para `actions/setup-java@v5`.
- Não foi mascarado o erro com jobs que retornem sucesso sem executar testes.

## Próximo passo obrigatório

Enviar o código-fonte completo ao GitHub. Depois disso, confirmar que `frontend/package.json` e `backend/pom.xml` estão no branch principal, executar os workflows e corrigir erros reais de dependências, compilação ou testes.

**Importante:** nenhuma das duas execuções constitui aprovação de build. Elas demonstram apenas que os workflows foram iniciados; os comandos de validação foram interrompidos antes da execução.
