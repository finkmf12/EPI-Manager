# EPI Manager — Sistema de Gerenciamento de EPIs

Sistema proposto para controlar o cadastro de equipamentos, estoque, entregas a funcionários, devoluções, histórico de movimentações e validade.

> **Status:** documentação inicial. Este repositório ainda não contém uma aplicação implementada.

## Objetivo
Centralizar informações de funcionários e EPIs, acompanhar o estoque e manter o histórico de entregas e devoluções, incluindo o acompanhamento da validade de uso.

## Escopo previsto
- Cadastro, consulta, edição e inativação de funcionários.
- Cadastro, consulta e inativação de tipos de EPI.
- Entradas e consulta de estoque.
- Registro e consulta de entregas.
- Devoluções totais ou parciais.
- Histórico por funcionário e itens atualmente em posse.
- Consulta de EPIs vencidos ou próximos do vencimento.

## Tecnologias previstas
O documento-base recomenda **React** no frontend, **Java** no backend e armazenamento em **banco de dados relacional**. As versões, frameworks e infraestrutura ainda serão definidos.

## Documentação
- [Requisitos funcionais e não funcionais](docs/requisitos.md)
- [Regras de negócio RN01–RN14](docs/regras-de-negocio.md)
- [Arquitetura proposta](docs/arquitetura.md)
- [Diagramas UML](docs/diagramas-uml.md)

## Regras essenciais
- Matrícula de funcionário única.
- Não entregar mais unidades do que o saldo disponível.
- Não entregar para funcionário inativo ou com EPI inativo.
- Devolução não pode exceder a quantidade ainda em posse.
- Somente itens devolvidos como aptos retornam ao estoque.
- Movimentações confirmadas devem manter seu histórico.

## Fora do escopo inicial
Compras automatizadas, integração com fornecedores, folha de pagamento, assinatura digital, integração com sistemas governamentais e múltiplos níveis de acesso.

## Fonte e atribuição
Organizado com base no documento **“Documento de Requisitos — Sistema de Gestão de EPI”**, utilizado na Avaliação Prática 2: Modelagem de Sistemas. O documento identifica a **Premiersoft** como fonte e informa classificação pública, permitindo compartilhamento e divulgação desde que mantidas a integridade e a fonte original. Esta documentação não substitui o material original.

## Próximas etapas
- [ ] Validar requisitos.
- [ ] Modelar o banco de dados.
- [ ] Definir versões e frameworks.
- [ ] Implementar backend e frontend.
- [ ] Criar testes para as regras de negócio.
- [ ] Validar os fluxos de entrega, devolução e validade.

**Licença:** ainda não definida.