# Regras de Negócio

Relação organizada conforme o documento-base.

| Código | Regra |
|---|---|
| RN01 | A matrícula do funcionário deve ser única. |
| RN02 | Cada tipo de EPI deve possuir identificador único; o CA deve ser armazenado quando aplicável. |
| RN03 | Quantidades de entradas, entregas e devoluções devem ser números inteiros positivos. |
| RN04 | Saldo = entradas − entregas + devoluções aceitas. |
| RN05 | Não permitir entrega maior que o estoque disponível. |
| RN06 | Não permitir entrega para funcionário inativo. |
| RN07 | Não permitir entradas ou entregas de EPI inativo. |
| RN08 | Devolução não pode exceder a quantidade entregue ainda em posse do funcionário. |
| RN09 | O usuário informa a condição do item (apto/inapto); somente itens aptos retornam ao estoque. |
| RN10 | Movimentações confirmadas são preservadas; correções não apagam silenciosamente o registro original. |
| RN11 | A validade de uso é calculada a partir da data de entrega; EPI com validade de uso expirada não pode ser entregue novamente. |
| RN12 | Data da operação não pode ser posterior à data atual. |
| RN13 | Funcionários e tipos de EPI com movimentações não podem ser excluídos fisicamente, apenas inativados. |
| RN14 | Itens devolvidos inaptos não aumentam o estoque, mas a devolução permanece no histórico. |

## Validações por operação

### Entrega
Verificar situação ativa do funcionário e do EPI, saldo suficiente, quantidade inteira positiva, validade de uso vigente e data não posterior à data atual.

### Devolução
Verificar quantidade inteira positiva, limite da quantidade ainda em posse e condição informada do item.

### Integridade do histórico
Preservar movimentações confirmadas. Eventuais correções não devem apagar silenciosamente o registro original.

As validações acima apenas agrupam regras já presentes no documento-base; não constituem requisitos adicionais.