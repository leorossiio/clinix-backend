# Changelog

## Não publicado

### Operação e observabilidade

- **OpenTelemetry**: traces (HTTP, Express e PostgreSQL), métricas e logs enviados por OTLP a um coletor. Liga só com `OTEL_EXPORTER_OTLP_ENDPOINT` ([ADR 0005](docs/adr/0005-telemetria-com-opentelemetry-e-eventos-de-dominio.md)).
- **Logs estruturados** em JSON (pino), com `trace_id`, `span_id` e `x-request-id` em cada linha; credenciais são ocultadas.
- **Métricas de negócio** a partir de eventos de domínio: horários abertos, agendamentos e cancelamentos por especialidade, conflitos de agendamento e logins por resultado.
- `x-request-id` em toda resposta, reaproveitado quando enviado pelo proxy.
- `/ready` (prontidão: a API alcança o banco), além do `/health` (vivacidade).

### Banco de dados

- **Adaptador PostgreSQL** (`BANCO=postgres` + `DATABASE_URL`), validado pela mesma suíte de contrato; migrations aplicadas ao iniciar ([ADR 0006](docs/adr/0006-postgresql-alem-do-supabase.md)).
- `SEMEAR_DEMONSTRACAO=true` cria os dados de demonstração se o banco estiver vazio.
- Corrigido: datas perdiam os milissegundos ao serem gravadas (encontrado pela suíte de contrato contra PostgreSQL).

### Engenharia

- Teste de concorrência: dois pacientes agendando o mesmo horário ao mesmo tempo; um consegue e o outro recebe conflito.
- O Jenkins roda os testes de contrato contra um PostgreSQL efêmero.
- A imagem Docker inclui as migrations e sobe com a instrumentação.

## 2.0.0

Reescrita da API em camadas (domínio, aplicação, infraestrutura, HTTP) com testes automatizados, correções de segurança e das regras de negócio. **Contém mudanças incompatíveis: publique junto com o frontend 2.0.0.**

### Checklist de deploy

1. **`JWT_SECRET` com no mínimo 32 caracteres.** A API não sobe com segredo curto (o exemplo antigo, `token`, podia ser quebrado por força bruta). Trocar o segredo desloga todos os usuários uma vez.
2. **`SUPABASE_URL` agora é variável de ambiente** (antes estava fixa no código). Valor atual: `https://nyfgvjbksgggpjdkmhxv.supabase.co`.
3. Defina `CORS_ORIGINS` com o domínio do frontend (ex.: o da Vercel).
4. Opcional: aplique `database/migrations/002_indices.sql`. Nenhuma migração é obrigatória — o schema do banco não mudou.
5. Recomendado: peça a todos os usuários que troquem a senha (a API antiga devolvia as senhas nas respostas).

### Segurança

- Senhas passam a ser gravadas com bcrypt; as antigas, em texto puro, são convertidas no primeiro login de cada usuário ([ADR 0002](docs/adr/0002-hash-de-senha-com-migracao-transparente.md)).
- A API não devolve mais a senha em nenhuma resposta.
- Rotas que estavam **sem autenticação** agora exigem token e permissão: editar, excluir e consultar usuários; cancelar e reagendar consultas; notificações.
- Um paciente não consegue mais agendar em nome de outro (o id vinha do corpo da requisição; agora vem do token).
- Usuário excluído perde o acesso imediatamente, mesmo com token válido.
- Login responde igual para e-mail inexistente e senha errada, e tem limite de tentativas por IP.
- Removida a rota pública `/env-check`. Adicionados cabeçalhos de segurança (Helmet) e CORS configurável.

### Regras de negócio

- Paciente volta a ver as **próprias consultas** além dos horários livres (regressão do commit `62d40cb`, que escondia agendamentos, cancelamentos e o botão de reagendar).
- Cancelamento pelo paciente exige no mínimo 24h de antecedência (CLINIXSM-50).
- Não é mais possível agendar um horário já agendado por outra pessoa, nem horários no passado (CLINIXSM-46).
- O médico não pode ter dois horários ativos no mesmo instante (CLINIXSM-45).
- Médico só abre e altera horários na **própria** agenda; administrador informa o médico.
- Criar consulta não sobrescreve mais uma consulta cancelada do mesmo médico (a lógica antiga de "reativar" apagava o histórico do paciente).
- Reagendamento validado no servidor (antes a rota aceitava qualquer consulta, de qualquer pessoa).
- Datas tratadas com fuso horário explícito ([ADR 0004](docs/adr/0004-fuso-horario-na-fronteira-do-banco.md)).

### Contrato da API (incompatível)

| Antes                                                 | Agora                                                                                     |
| ----------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `POST /auth/login` → `{ token }`                      | `{ token, usuario }`; o token usa o claim padrão `sub` para o id                          |
| Consultas com `id_usuario` e sem nomes                | `id_paciente`, mais `medico { nome, especialidade }`, `paciente { nome }` e `reagendavel` |
| `GET /consultas/usuario` (paciente)                   | `GET /consultas`, com recorte automático por perfil                                       |
| `GET /consultas/:id/autenticar-consulta`              | Campo `reagendavel` na listagem                                                           |
| `GET /consultas/:id/agendadas` (quebrada)             | Removida                                                                                  |
| `PUT /consultas/:id/agendar` com `{ id_usuario }`     | Sem corpo; o paciente vem do token                                                        |
| Datas sem fuso (`2026-10-01T14:30`)                   | ISO 8601 com fuso (`2026-10-01T17:30:00.000Z`) na entrada e na saída                      |
| `DELETE /usuarios/:id` → `200 { message }`            | `204` sem corpo                                                                           |
| Ações sobre consultas → `{ message }`                 | A consulta atualizada                                                                     |
| `GET /usuarios` para médico e admin                   | Somente admin                                                                             |
| Erros de regra de negócio → `400`/`500`               | `422`, e `409` para conflitos                                                             |
| Notificações com `titulo`/`mensagem` (não funcionava) | `id_consulta` e `lembrete`, como na tabela                                                |

### Engenharia

- Express 5, testes com Vitest + Supertest (TDD), ESLint + Prettier, cobertura mínima obrigatória.
- Documentação OpenAPI única e corrigida (enums estavam errados e duplicados em comentários não usados).
- Dockerfile (usuário não-root, health check) e Jenkinsfile.
- Modo `BANCO=memoria` para rodar localmente sem credenciais.
- Removidos arquivos e dependências sem uso (`sendEmail.js`, `utils/jwt.js`, `pg`, `swagger-jsdoc`, `uuid`, `yamljs`, `dotenv`).
