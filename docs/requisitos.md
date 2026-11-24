# Requisitos do Sistema

Conteúdo organizado a partir do documento-base “Documento de Requisitos — Sistema de Gestão de EPI”, mantendo os códigos RF e RNF.

## Requisitos funcionais

### Funcionários
| Código | Descrição |
|---|---|
| RF01 | Cadastrar funcionário com nome completo, matrícula única, setor e situação (ativo/inativo). |
| RF02 | Consultar funcionários por nome ou matrícula. |
| RF03 | Editar dados e inativar funcionários, preservando o histórico. |

### Tipos de EPI
| Código | Descrição |
|---|---|
| RF04 | Cadastrar EPI com nome, descrição, CA, prazo de validade de uso em meses quando aplicável e situação. |
| RF05 | Consultar tipos de EPI cadastrados. |
| RF06 | Inativar tipos de EPI, preservando o histórico. |

### Estoque
| Código | Descrição |
|---|---|
| RF07 | Consultar quantidade disponível por tipo de EPI. |
| RF08 | Registrar entradas com tipo, quantidade, data e observação opcional. |
| RF09 | Consultar movimentações com data, quantidade e tipo. |

### Entregas
| Código | Descrição |
|---|---|
| RF10 | Registrar entrega de um ou mais tipos de EPI a funcionário, com quantidade e data. |
| RF11 | Consultar entregas por funcionário, EPI e período. |
| RF12 | Consultar histórico de entregas por funcionário em ordem cronológica. |
| RF13 | Consultar EPIs em posse e quantidades entregues ainda não devolvidas. |

### Devoluções
| Código | Descrição |
|---|---|
| RF14 | Registrar devolução total ou parcial com funcionário, tipo, quantidade e data. |
| RF15 | Consultar devoluções por funcionário, EPI e período. |
| RF16 | Atualizar quantidades em posse e no estoque conforme a condição informada. |

### Validade
| Código | Descrição |
|---|---|
| RF17 | Consultar EPIs entregues vencidos ou próximos do vencimento, quando houver prazo definido. |
| RF18 | Destacar vencidos e itens com vencimento nos próximos 30 dias. |
| RF19 | Impedir entrega de EPI com validade de uso expirada. |

## Requisitos não funcionais
| Código | Descrição |
|---|---|
| RNF01 | React no frontend e Java no backend, com responsabilidades separadas. |
| RNF02 | Banco relacional com dados persistentes após reinicializações. |
| RNF03 | Integridade dos saldos mesmo em falhas de operação. |
| RNF04 | Rótulos claros, formulários organizados e mensagens compreensíveis. |
| RNF05 | Código organizado em componentes/módulos, responsabilidades definidas e sem duplicação desnecessária. |
| RNF06 | Consistência visual. |
| RNF07 | Mensagens de erro compreensíveis, sem expor detalhes técnicos. |

## Fora do escopo inicial
- Compras automatizadas.
- Integração com fornecedores.
- Folha de pagamento.
- Assinatura digital.
- Integração com sistemas governamentais.
- Múltiplos níveis de acesso.

## Observação
Versões, endpoints, modelo físico do banco, autenticação e infraestrutura não são detalhados integralmente no documento-base e permanecem decisões futuras.