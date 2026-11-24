# Contrato inicial da API

Base path: `/api/v1`

## Cadastro de empresa

`POST /auth/register-company` (somente quando a configuração `REGISTRATION_ENABLED=true` estiver habilitada)

Recebe `razaoSocial`, `nomeFantasia`, `cnpj`, `emailContato`, `telefone`, `nomeAdministrador`, `emailAdministrador` e `senhaAdministrador`. O servidor normaliza e valida o CNPJ, cria empresa, usuário e associação em uma única transação e atribui o perfil `ADMIN` ao primeiro usuário. A resposta inclui um access token já vinculado à empresa. A rota fica desativada por padrão; habilite somente após configurar rate limit/WAF no gateway. O limitador em memória da API é apenas uma defesa adicional por instância.

## Login

A autenticação compara o hash BCrypt no servidor. E-mails são normalizados em minúsculas; o banco mantém unicidade case-insensitive. O login lista somente empresas ativas com vínculo ativo.

`POST /auth/login`

```json
{
  "email": "usuario@empresa.com",
  "password": "senha"
}
```

Resposta `200`: `selectionToken`, `tokenType`, `expiresInSeconds`, `user` e `companies[]`.

## Selecionar empresa

`POST /auth/select-company`

Header: `Authorization: Bearer <selectionToken>`

```json
{
  "companyId": "00000000-0000-0000-0000-000000000000"
}
```

Resposta `200`: `accessToken`, `tokenType`, `expiresInSeconds`, `companyId` e `companyProfile`.

## Usuário atual

`GET /auth/me`

Header: `Authorization: Bearer <accessToken>`

## Empresa atual

`GET /companies/current`

Header: `Authorization: Bearer <accessToken>`

A consulta valida novamente se o vínculo de usuário e empresa continua ativo, exige uma transação Spring e define contexto tenant com `set_config(..., true)` antes de ler `epi_manager.empresas`.


## Setores

Todos os endpoints abaixo exigem token `ACCESS` da empresa selecionada. O `empresaId` é obtido do JWT validado no servidor; não é aceito no corpo da requisição.

| Método | Endpoint | Perfis |
|---|---|---|
| GET | `/sectors` | ADMIN, ALMOXARIFE, CONSULTA |
| GET | `/sectors/{id}` | ADMIN, ALMOXARIFE, CONSULTA |
| POST | `/sectors` | ADMIN, ALMOXARIFE |
| PUT | `/sectors/{id}` | ADMIN, ALMOXARIFE |
| PATCH | `/sectors/{id}/deactivate` | ADMIN |

A desativação é lógica. O registro não é apagado. A listagem aceita `includeInactive=true` para usuários com acesso de consulta.

## Colaboradores

| Método | Endpoint | Perfis |
|---|---|---|
| GET | `/collaborators` | ADMIN, ALMOXARIFE, CONSULTA |
| GET | `/collaborators/{id}` | ADMIN, ALMOXARIFE, CONSULTA |
| POST | `/collaborators` | ADMIN, ALMOXARIFE |
| PUT | `/collaborators/{id}` | ADMIN, ALMOXARIFE |
| PATCH | `/collaborators/{id}/status` | ADMIN |

A listagem aceita o filtro `status=ATIVO`, `INATIVO` ou `AFASTADO`. O vínculo de setor é validado no escopo da empresa atual. CPF não é aceito nem retornado nesta etapa; a coleta será habilitada somente depois de definir criptografia, gestão de chaves, busca por hash e política de acesso LGPD.

## Categorias de EPI

Todas as operações usam o tenant ativo do JWT, revalidado pelo PostgreSQL na transação. `empresaId` nunca é recebido do navegador.

| Método | Endpoint | Perfis |
|---|---|---|
| GET | `/categories` | ADMIN, ALMOXARIFE, CONSULTA |
| GET | `/categories/{id}` | ADMIN, ALMOXARIFE, CONSULTA |
| POST | `/categories` | ADMIN, ALMOXARIFE |
| PUT | `/categories/{id}` | ADMIN, ALMOXARIFE |
| PATCH | `/categories/{id}/deactivate` | ADMIN |

A listagem aceita `includeInactive=true`. Categorias são inativadas logicamente. Uma categoria inativa não pode ser atribuída a um novo EPI.

## Catálogo de EPIs

| Método | Endpoint | Perfis |
|---|---|---|
| GET | `/epis` | ADMIN, ALMOXARIFE, CONSULTA |
| GET | `/epis/{id}` | ADMIN, ALMOXARIFE, CONSULTA |
| POST | `/epis` | ADMIN, ALMOXARIFE |
| PUT | `/epis/{id}` | ADMIN, ALMOXARIFE |
| PATCH | `/epis/{id}/deactivate` | ADMIN |

A listagem aceita `includeInactive=true`. O código do EPI é único dentro da empresa. A unidade deve ser uma das opções `UN`, `PAR`, `CX`, `KG`, `G`, `L`, `ML`, `M` ou `M2`. `estoqueMinimo` aceita até três casas decimais. A categoria é opcional, mas quando informada precisa existir e estar ativa na mesma empresa. O CA, sua validade e a vida útil permanecem separados da validade física dos lotes.

## Fornecedores

| Método | Endpoint | Perfis |
|---|---|---|
| GET | `/suppliers` | ADMIN, ALMOXARIFE, CONSULTA |
| GET | `/suppliers/{id}` | ADMIN, ALMOXARIFE, CONSULTA |
| POST | `/suppliers` | ADMIN, ALMOXARIFE |
| PUT | `/suppliers/{id}` | ADMIN, ALMOXARIFE |
| PATCH | `/suppliers/{id}/deactivate` | ADMIN |

A listagem aceita `includeInactive=true`. O CNPJ é opcional e, quando preenchido, é normalizado e validado pela mesma regra numérica/alfanumérica usada no cadastro de empresas. Fornecedores são inativados logicamente para preservar o vínculo com lotes de estoque.

## Estoque e recebimentos

O tenant é obtido exclusivamente do access token e revalidado no início da transação. O cliente não envia `empresaId`, `usuarioId` nem saldo calculado.

| Método | Endpoint | Perfis |
|---|---|---|
| POST | `/stock/receipts` | ADMIN, ALMOXARIFE |
| GET | `/stock/lots` | ADMIN, ALMOXARIFE, CONSULTA |
| GET | `/stock/balances` | ADMIN, ALMOXARIFE, CONSULTA |
| GET | `/stock/movements` | ADMIN, ALMOXARIFE, CONSULTA |

`POST /stock/receipts` cria o lote e lança a movimentação `ENTRADA` na mesma transação. A quantidade inicial e o saldo disponível começam com o valor recebido. O fornecedor é opcional, mas quando informado precisa estar ativo e pertencer à empresa. O endpoint não aceita saldo inicial editado pelo cliente: a quantidade recebida é a única origem dos dois valores.

`GET /stock/balances` mostra saldo não vencido, saldo em lotes vencidos, estoque mínimo e situação ativa/inativa do EPI. Lotes sem data de validade são apresentados no saldo disponível; lotes com validade anterior à data atual aparecem separadamente como vencidos. `GET /stock/movements` aceita `epiId` opcional e `limit` de 1 a 200 (padrão 50).

## Entregas

| Método | Endpoint | Perfis |
|---|---|---|
| GET | `/deliveries` | ADMIN, ALMOXARIFE, CONSULTA |
| GET | `/deliveries/{id}` | ADMIN, ALMOXARIFE, CONSULTA |
| POST | `/deliveries` | ADMIN, ALMOXARIFE |
| POST | `/deliveries/{id}/confirm` | ADMIN, ALMOXARIFE |
| POST | `/deliveries/{id}/cancel` | ADMIN, ALMOXARIFE |

A criação registra a entrega e os itens como `RASCUNHO`. Cada item aponta para um EPI e um lote da mesma empresa. A confirmação atualiza o status; os gatilhos do PostgreSQL validam colaborador, atividade do EPI, CA, validade física do lote, saldo e concorrência, baixando o saldo e criando a movimentação `SAIDA` atomicamente. Qualquer falha reverte a confirmação inteira. Entregas confirmadas não podem ser editadas nem canceladas nesta versão. Somente rascunhos podem ser cancelados. O parâmetro `limit` da listagem aceita 1 a 100 (padrão 50).

## Devoluções

| Método | Endpoint | Perfis |
|---|---|---|
| GET | `/returns` | ADMIN, ALMOXARIFE, CONSULTA |
| GET | `/returns/{id}` | ADMIN, ALMOXARIFE, CONSULTA |
| POST | `/returns` | ADMIN, ALMOXARIFE |
| POST | `/returns/{id}/confirm` | ADMIN, ALMOXARIFE |
| POST | `/returns/{id}/cancel` | ADMIN, ALMOXARIFE |

A devolução sempre referencia uma entrega confirmada e seus itens. A quantidade total devolvida não pode exceder a quantidade originalmente entregue, incluindo devoluções anteriores ainda em rascunho ou confirmadas. Devoluções canceladas não consomem esse limite. Ao confirmar, somente itens com condição `REUTILIZAVEL` retornam ao lote e geram movimento `DEVOLUCAO`; `DANIFICADO` e `DESCARTE` ficam no histórico, sem aumentar saldo. A confirmação e as alterações de estoque acontecem na mesma transação. Somente rascunhos podem ser cancelados.

As regras de confirmação no banco são a última barreira de integridade. A API não atualiza diretamente `quantidade_disponivel` nem insere movimentos de saída/devolução de uma entrega: ela cria o documento e aciona o gatilho transacional por meio da mudança de status.

### Exemplo de recebimento

```json
{
  "epiId": "00000000-0000-0000-0000-000000000001",
  "fornecedorId": "00000000-0000-0000-0000-000000000002",
  "codigoLote": "LOTE-2026-001",
  "dataFabricacao": "2026-09-01",
  "dataValidade": "2028-09-01",
  "quantidade": 25,
  "custoUnitario": 24.5000,
  "observacao": "Recebimento da nota fiscal de compra"
}
```

### Exemplo de entrega

```json
{
  "colaboradorId": "00000000-0000-0000-0000-000000000003",
  "dataEntrega": "2026-11-23",
  "observacao": "Entrega de EPIs para início de atividade",
  "itens": [
    {
      "epiId": "00000000-0000-0000-0000-000000000001",
      "loteId": "00000000-0000-0000-0000-000000000004",
      "quantidade": 1,
      "dataPrevistaSubstituicao": "2027-11-23",
      "observacao": "Tamanho ajustado ao colaborador"
    }
  ]
}
```

### Exemplo de devolução

```json
{
  "entregaId": "00000000-0000-0000-0000-000000000005",
  "dataDevolucao": "2027-11-23",
  "observacao": "Devolução por substituição do equipamento",
  "itens": [
    {
      "itemEntregaId": "00000000-0000-0000-0000-000000000006",
      "quantidade": 1,
      "condicao": "REUTILIZAVEL",
      "observacao": "Equipamento em boas condições"
    }
  ]
}
```
