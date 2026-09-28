# Datas como instantes no domínio; fuso da clínica só na fronteira do banco

A coluna `consulta.data` é `TIMESTAMP` sem fuso e guarda o horário de parede da clínica (o frontend antigo enviava "2026-10-01T14:30" sem fuso). O servidor em nuvem roda em UTC, então comparações como "faltam 24h?" ficavam até 3 horas erradas. Decidimos: a API recebe e devolve instantes ISO 8601 em UTC; o domínio só trabalha com `Date`; e o repositório converte usando `TZ_CLINICA` (padrão `America/Sao_Paulo`) — na leitura, texto sem fuso é interpretado no fuso da clínica; na escrita, gravamos o horário local **com** deslocamento explícito (`14:30-03:00`), que funciona tanto para `TIMESTAMP` quanto para `TIMESTAMPTZ`.

## Consequências

- Migrar a coluna para `TIMESTAMPTZ` não exige mudança de código.
- `data_cancelamento` gravada pela versão anterior está em UTC e será lida como horário local, com até 3h de diferença; isso afeta apenas a janela de reagendamento de cancelamentos antigos.
