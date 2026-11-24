# Diagramas UML — EPI Manager

Os diagramas são representações iniciais para apoiar a modelagem, com base nos requisitos do documento. Devem ser revisados e detalhados; não substituem a validação formal.

## 1. Casos de uso — visão geral
```mermaid
flowchart LR
  A((Usuário responsável))
  subgraph S["EPI Manager"]
    U1[Gerenciar funcionários]
    U2[Gerenciar tipos de EPI]
    U3[Consultar estoque]
    U4[Registrar entrada]
    U5[Registrar entrega]
    U6[Consultar entregas e histórico]
    U7[Registrar devolução]
    U8[Consultar devoluções]
    U9[Consultar validade]
  end
  A --- U1
  A --- U2
  A --- U3
  A --- U4
  A --- U5
  A --- U6
  A --- U7
  A --- U8
  A --- U9
```
O ator é genérico; o documento-base não define níveis distintos de acesso.

## 2. Atividade — entrega
```mermaid
flowchart TD
  S([Início]) --> F[Selecionar funcionário]
  F --> E[Selecionar EPI e quantidade]
  E --> V{Funcionário ativo?}
  V -- Não --> X[Informar impedimento]
  V -- Sim --> A{EPI ativo e validade vigente?}
  A -- Não --> X
  A -- Sim --> Q{Saldo suficiente?}
  Q -- Não --> X
  Q -- Sim --> D[Registrar entrega e data]
  D --> H[Atualizar saldo e histórico]
  H --> T([Fim])
  X --> T
```

## 3. Atividade — devolução
```mermaid
flowchart TD
  S([Início]) --> F[Identificar funcionário e EPI]
  F --> Q[Informar quantidade devolvida]
  Q --> V{Quantidade válida e disponível em posse?}
  V -- Não --> X[Informar inconsistência]
  V -- Sim --> C{Item apto?}
  C -- Sim --> A[Registrar devolução e somar ao estoque]
  C -- Não --> I[Registrar devolução sem somar ao estoque]
  A --> H[Preservar movimentação no histórico]
  I --> H
  H --> T([Fim])
  X --> T
```

## 4. Classes — modelo conceitual inicial
```mermaid
classDiagram
  class Funcionario {
    +id
    +nomeCompleto
    +matricula
    +setor
    +situacao
  }
  class TipoEPI {
    +id
    +nome
    +descricao
    +ca
    +prazoValidadeUsoMeses
    +situacao
  }
  class MovimentacaoEstoque {
    +id
    +tipo
    +quantidade
    +data
    +observacao
  }
  class Entrega {
    +id
    +quantidade
    +data
  }
  class Devolucao {
    +id
    +quantidade
    +data
    +condicaoItem
  }
  Funcionario "1" --> "0..*" Entrega
  TipoEPI "1" --> "0..*" Entrega
  Funcionario "1" --> "0..*" Devolucao
  TipoEPI "1" --> "0..*" Devolucao
  TipoEPI "1" --> "0..*" MovimentacaoEstoque
```
Atributos, tipos, chaves e cardinalidades são preliminares e deverão ser refinados.

## 5. Componentes — visão proposta
```mermaid
flowchart TB
  UI[Interface React] --> API[Camada de API]
  API --> BL[Regras de negócio]
  BL --> DAL[Persistência / acesso a dados]
  DAL --> DB[(Banco relacional)]
```

## 6. Implantação — visão lógica
```mermaid
flowchart LR
  C[Navegador do usuário] --> W[Aplicação frontend]
  W --> S[Servidor da aplicação Java]
  S --> DB[(Servidor de banco relacional)]
```
Hospedagem, rede e infraestrutura ainda não foram definidas.