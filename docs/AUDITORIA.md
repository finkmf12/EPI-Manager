# Auditoria do sistema

## Objetivo

Manter um histórico consultável das operações importantes realizadas pelos usuários, permitindo identificar quem executou uma ação, quando ela ocorreu e qual registro foi afetado.

## Estrutura utilizada

O projeto já possui a tabela `epi_manager.logs_auditoria`. Ela armazena:

- Empresa e usuário responsáveis.
- Ação executada e entidade afetada.
- Identificador do registro relacionado.
- Dados anteriores e novos em formato JSONB.
- Data e horário do evento.
- Campos opcionais para IP e navegador, reservados para evolução futura.

A tabela utiliza Row Level Security (RLS), com escopo por empresa. Também possui proteção no banco contra atualização e exclusão dos registros históricos. O papel de execução da API possui permissão de leitura e inserção, sem permissão de alteração ou exclusão.

## Eventos registrados nesta etapa

| Entidade | Ação | Quando ocorre |
|---|---|---|
| Estoque | `ENTRADA_ESTOQUE` | Ao registrar o recebimento de um lote. |
| Entrega | `CRIAR_RASCUNHO` | Ao criar uma entrega em rascunho. |
| Entrega | `CONFIRMAR` | Ao confirmar a entrega. |
| Entrega | `CANCELAR` | Ao cancelar uma entrega em rascunho. |
| Devolução | `CRIAR_RASCUNHO` | Ao criar uma devolução em rascunho. |
| Devolução | `CONFIRMAR` | Ao confirmar a devolução. |
| Devolução | `CANCELAR` | Ao cancelar uma devolução em rascunho. |

Os registros de auditoria são inseridos na mesma transação da operação. Assim, se a operação principal falhar, o respectivo evento também não é gravado; se a gravação da auditoria falhar, a operação é revertida.

## Consulta e permissões

- Endpoint: `GET /api/v1/audit-logs`.
- A consulta exige autenticação e perfil `ADMIN`.
- O resultado é limitado a 200 eventos por chamada, ordenados do mais recente para o mais antigo.
- O contexto de empresa é validado no back-end e reforçado pelas políticas RLS.
- A interface fica disponível na opção **Auditoria** do menu para administradores.

## Limitações conhecidas

Nesta primeira versão, a auditoria cobre entradas de estoque e o ciclo de vida de entregas e devoluções. Cadastros de colaboradores, EPIs, fornecedores, setores, categorias e alterações de configurações ainda não geram eventos nesta tela. Os campos de IP e user-agent também não são preenchidos nesta etapa.

A implementação deve ser validada em ambiente publicado, especialmente quanto a permissões do perfil administrador, isolamento entre empresas e gravação dos eventos em operações reais.
