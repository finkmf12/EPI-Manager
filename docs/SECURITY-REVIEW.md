# Revisão de segurança — fundação da API

## Controles implementados

- Hash de senha validado com BCrypt (cost 12); comparação executada apenas no servidor.
- Mensagem de falha de login genérica e verificação BCrypt com hash fictício para contas inexistentes, reduzindo enumeração por diferença de tempo.
- Cadastro inicial usa uma transação única e contexto RLS de onboarding; o primeiro membro recebe o perfil `ADMIN`.
- Cadastro público desativado por padrão e protegido por limitador local por IP; exige rate limiting/WAF no gateway antes de habilitar em produção.
- Operações de setores, colaboradores, catálogo, estoque, entregas e devoluções derivam o tenant do JWT no servidor e revalidam o vínculo ativo; não aceitam `empresa_id` nem `usuario_id` do cliente.
- CNPJ é normalizado, validado com dígitos verificadores e aceito no formato numérico ou alfanumérico da Receita Federal.
- E-mail normalizado com `trim + lowercase`; índice único por `lower(email)` evita duplicidade por caixa.
- JWT assinado com HS256 e segredo Base64 de no mínimo 32 bytes.
- Tokens com emissor e expiração validados; seleção de empresa e acesso são tipos distintos.
- Token de seleção dura 3 minutos e não contém `tenant_id`.
- Token de acesso dura 15 minutos e só é emitido após consulta ao perfil ativo no banco.
- RLS do banco continua sendo a segunda barreira; contexto tenant é transaction-local, só é aceito dentro de transação Spring e revalida o vínculo ativo no banco antes de cada ativação.
- Recebimento cria lote e ledger de entrada na mesma transação; a confirmação de entrega/devolução delega a baixa/retorno aos gatilhos do PostgreSQL.
- A API não atualiza o saldo por endpoints genéricos e não oferece edição ou remoção dos registros imutáveis do ledger.
- Conexão da aplicação usa login dedicado com `NOINHERIT` e `SET ROLE epi_manager_runtime`.
- CORS usa origens explícitas; credenciais cross-origin não são habilitadas.
- O front-end envia o JWT no cabeçalho `Authorization` e mantém o token somente em memória; não usa `localStorage` ou `sessionStorage`. A sessão é encerrada ao recarregar a página até existir renovação segura.
- O navegador não recebe chaves Supabase, senha JDBC nem segredo de assinatura JWT; as rotas de negócio passam pela API Spring Boot.
- Swagger UI/OpenAPI só é público quando `API_DOCS_PUBLIC=true`; manter desativado em produção.
- API não expõe detalhes do Actuator nem mensagens SQL ao cliente.

## Pendências antes de produção

- Configurar e testar a senha do papel `epi_manager_app` no Supabase.
- Configurar segredos em um serviço de hospedagem de back-end, nunca no React/Vercel público.
- Implementar limite distribuído de tentativas de login no gateway/Redis e proteção anti-automação no cadastro público. O limitador em memória já presente na API não substitui controles de borda.
- Implementar recuperação de senha, verificação de e-mail, refresh-token rotativo e revogação de sessões.
- Implementar renovação de sessão por refresh-token rotativo e avaliar cookie `HttpOnly`/`Secure` conforme a arquitetura final; até lá, o JWT permanece somente em memória e a sessão termina ao recarregar a página.
- Executar `mvn verify` e testes de integração HTTP/JDBC contra PostgreSQL real com o login `epi_manager_app`, incluindo tentativas de trocar `tenant_id`, usar colaborador de outra empresa, selecionar lote cruzado e confirmar entrega sem saldo.
- Revisar papéis globais de administrador da plataforma antes de habilitar essa interface.
- Adicionar logs de auditoria sem registrar senha, JWT, CNPJ/CPF em claro ou payloads sensíveis.
- Avaliar política de retenção e criptografia para dados pessoais conforme LGPD.

## Observação

As funções `SECURITY DEFINER` são intencionais e estreitas. Elas pertencem ao schema privado, usam `search_path` fixo e têm `EXECUTE` revogado de `PUBLIC`, `anon`, `authenticated` e `service_role`; apenas `epi_manager_runtime` recebe execução. Qualquer nova função com privilégios elevados exige revisão equivalente.
