# Telemetria com OpenTelemetry, e métricas de negócio a partir de eventos de domínio

A API precisava de logs, métricas e traces para ser operada e diagnosticada. Adotamos OpenTelemetry: a aplicação só fala OTLP com um coletor, que distribui cada sinal ao seu backend (no Docker Compose: Tempo, Prometheus e Loki). Trocar de fornecedor é mudança na configuração do coletor, não no código. A instrumentação é carregada à parte (`node --import ./src/instrumentacao.js`) e só liga com `OTEL_EXPORTER_OTLP_ENDPOINT` definida.

As métricas de negócio (agendamentos, cancelamentos, conflitos, logins) não são registradas direto nos casos de uso. Eles publicam **eventos de domínio** numa porta (`application/eventos.js`), e a infraestrutura transforma cada evento em contador e linha de log (`infrastructure/observabilidade/publicadorDeEventos.js`).

## Opções consideradas

- **Endpoint `/metrics` com prom-client:** mais simples, mas prende a aplicação ao Prometheus e não resolve traces nem logs.
- **Chamar a API do OpenTelemetry dentro dos casos de uso:** funciona, mas acopla a aplicação a um detalhe de infraestrutura e obriga os testes a lidar com telemetria.

## Consequências

- Os testes verificam que os eventos certos são publicados usando um dublê da porta, sem OpenTelemetry.
- Eventos nunca carregam dados pessoais, e o id da consulta vai para o log mas nunca para rótulo de métrica (cardinalidade).
- O SDK de métricas do Node não gera exemplars. O link métrica → trace no Grafana usa as métricas que o Tempo deriva dos traces.
