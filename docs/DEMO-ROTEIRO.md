# Roteiro de demonstração — EPI Manager

Este roteiro organiza uma apresentação acadêmica de ponta a ponta. Use uma base de homologação isolada e dados fictícios. Não cadastre dados pessoais reais durante a apresentação.

## 1. Problema que o sistema resolve

O sistema centraliza o controle de EPIs por empresa, setor e colaborador. O objetivo é reduzir controles manuais, melhorar a rastreabilidade do estoque e manter o histórico de entregas e devoluções.

## 2. Sequência sugerida

1. Entrar com uma conta de demonstração e selecionar a empresa.
2. Mostrar o dashboard e explicar os indicadores disponíveis.
3. Cadastrar um setor e um colaborador fictícios.
4. Criar uma categoria e cadastrar um EPI com unidade e estoque mínimo.
5. Cadastrar um fornecedor fictício.
6. Registrar o recebimento de um lote, conferindo quantidade, validade e fornecedor.
7. Abrir estoque e mostrar saldo, lote e movimentação de entrada.
8. Criar uma entrega para o colaborador e confirmar a operação.
9. Conferir a baixa no saldo e o registro da movimentação.
10. Criar uma devolução, diferenciando material reutilizável e danificado, e confirmar.
11. Conferir o saldo final e o histórico de movimentações.
12. Mostrar a documentação OpenAPI e explicar a separação entre front-end, API e banco.

## 3. Conceitos técnicos para explicar

- **React + TypeScript:** interface modular e tipada.
- **API REST:** comunicação entre interface e servidor por HTTP/JSON.
- **Spring Boot:** regras de negócio, validação, autenticação e transações.
- **PostgreSQL:** persistência relacional e integridade dos dados.
- **RLS e multiempresa:** políticas no banco restringem o acesso aos dados da empresa ativa.
- **Transações:** operações de estoque e confirmação de entrega/devolução devem manter os registros consistentes.

## 4. Perguntas que a banca pode fazer

**Por que separar front-end e back-end?**  
Para separar apresentação das regras de negócio, centralizar a validação e permitir que diferentes clientes consumam a mesma API.

**Por que usar banco relacional?**  
Porque há relacionamentos claros entre empresas, colaboradores, EPIs, lotes, entregas e movimentações, além da necessidade de integridade referencial e transações.

**Como evitar que uma empresa veja os dados de outra?**  
A API valida o vínculo do usuário com a empresa e define o contexto da transação. O PostgreSQL aplica políticas RLS para restringir as linhas acessíveis.

**Por que registrar movimentações em vez de apenas alterar o saldo?**  
O histórico permite rastrear entradas, entregas e devoluções, explicar como o saldo foi formado e apoiar auditorias.

**O que acontece quando uma entrega é confirmada?**  
A confirmação executa as regras transacionais no back-end/banco, valida a disponibilidade e registra a baixa de estoque junto com a movimentação.

## 5. Limites a declarar com transparência

Antes da banca, execute os testes e confirme quais módulos estão publicados e homologados. Não apresente alertas automáticos, relatórios, comprovantes PDF, assinatura formal, recuperação de senha ou refresh token como concluídos enquanto esses recursos não estiverem implementados e testados.
