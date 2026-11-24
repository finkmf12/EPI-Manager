# Regras de Negócio — EPI Manager

**Projeto:** Sistema de Gestão de Equipamentos de Proteção Individual (EPI)  
**Documento de referência:** Documento de Requisitos — Sistema de Gestão de EPI (Premiersoft), seção 6 — Regras de negócio.  
**Finalidade:** registrar as regras que restringem e orientam as operações do sistema.

As regras abaixo representam as condições que o sistema deve respeitar para manter a integridade dos cadastros, do estoque e do histórico de movimentações.

## RN01 — Identificação única de funcionário
Cada funcionário deverá possuir uma matrícula única. Não será permitido cadastrar duas pessoas com a mesma matrícula.

## RN02 — Identificação de EPI
Cada tipo de EPI deverá possuir um identificador único no sistema. O número do Certificado de Aprovação (CA) deverá ser armazenado para os equipamentos aos quais ele se aplica.

## RN03 — Quantidades válidas
As quantidades de entradas, entregas e devoluções deverão ser números inteiros positivos.

## RN04 — Saldo de estoque
O estoque disponível de um tipo de EPI será calculado pela quantidade de entradas, menos as entregas, mais as devoluções aceitas para retorno ao estoque.

## RN05 — Proibição de estoque negativo
Uma entrega não poderá ser registrada se a quantidade solicitada for superior à quantidade disponível.

## RN06 — Funcionário ativo
Não será permitido registrar novas entregas para funcionários inativos. O histórico anterior deverá permanecer acessível.

## RN07 — EPI ativo
Não será permitido registrar entradas ou entregas de tipos de EPI inativos. Movimentações históricas continuarão disponíveis para consulta.

## RN08 — Devolução limitada
A quantidade devolvida não poderá exceder a quantidade entregue que ainda estiver em posse do funcionário para aquele tipo de EPI.

## RN09 — Condição da devolução
No registro de devolução, o usuário deverá informar se o equipamento está apto ou inapto para retornar ao estoque. Somente equipamentos aptos deverão voltar ao saldo disponível.

## RN10 — Rastreabilidade das movimentações
Uma movimentação confirmada deverá ser preservada no histórico. Correções não deverão apagar silenciosamente o registro original.

## RN11 — Validade de uso
Quando houver prazo de validade de uso definido para um tipo de EPI, o sistema deverá calcular a data limite de uso a partir da data da entrega. Um equipamento cuja validade tenha expirado não poderá ser entregue novamente.

## RN12 — Data das operações
A data de uma movimentação não poderá ser posterior à data atual do sistema.

## RN13 — Inativação sem exclusão histórica
Funcionários e tipos de EPI com movimentações registradas não poderão ser excluídos fisicamente. Deverão ser inativados para preservar a integridade histórica.

## RN14 — Retorno de equipamentos
Equipamentos devolvidos como inaptos não poderão aumentar o estoque disponível. Sua devolução deverá permanecer registrada no histórico.

---

## Observação para avaliação

As regras de negócio descrevem **restrições e condições** que o sistema deve respeitar. Elas não são a mesma coisa que requisitos funcionais:

- **Requisito funcional (RF):** descreve uma função que o sistema deve oferecer.
- **Regra de negócio (RN):** define uma condição que limita ou orienta como essa função pode ser executada.

**Exemplo:** o requisito funcional RF10 permite registrar a entrega de EPI. A regra RN05 determina que essa entrega não pode ser confirmada se não houver quantidade suficiente em estoque.

## Fonte
Documento de Requisitos — Sistema de Gestão de EPI, seção 6 — Regras de negócio. Material de referência fornecido para o projeto acadêmico.
