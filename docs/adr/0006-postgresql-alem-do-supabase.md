# Adaptador PostgreSQL além do Supabase

Produção usa Supabase, mas o Supabase não roda num `docker compose up` simples, e os testes de contrato contra ele exigem um projeto dedicado. Criamos um adaptador PostgreSQL com SQL parametrizado (`infrastructure/postgres`), sobre o mesmo schema de `database/migrations`, usado no Docker Compose e no Jenkins. As migrations são aplicadas ao iniciar a API, com lock para várias instâncias não migrarem ao mesmo tempo.

## Consequências

- A mesma suíte de contrato valida memória, PostgreSQL e (quando configurado) Supabase. No primeiro uso contra o PostgreSQL ela revelou um bug real: o conversor de datas descartava milissegundos ao gravar.
- O mapeamento entre linhas e entidades ficou em `infrastructure/linhas.js`, compartilhado pelos dois adaptadores.
- Com `BANCO=postgres`, o Supabase pode ser substituído por qualquer PostgreSQL gerenciado sem mudar a aplicação.
