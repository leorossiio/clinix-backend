/**
 * Telemetria com OpenTelemetry: traces, métricas e logs enviados via OTLP a um
 * coletor (no Docker Compose, o otel-collector do repositório clinix-infra).
 *
 * Precisa carregar ANTES da aplicação, para instrumentar http, express, pg e
 * pino no momento em que são importados:
 *
 *   node --import ./src/instrumentacao.js src/server.js
 *
 * Só liga quando OTEL_EXPORTER_OTLP_ENDPOINT está definida; sem ela, este
 * arquivo não faz nada (testes e desenvolvimento local seguem iguais).
 * As demais variáveis OTEL_* padrão também são respeitadas.
 */
import { register } from 'node:module';
import { readFileSync } from 'node:fs';

if (process.env.OTEL_EXPORTER_OTLP_ENDPOINT) {
  // Em ESM, as instrumentações dependem deste hook de carregamento de módulos.
  register('@opentelemetry/instrumentation/hook.mjs', import.meta.url);
  await iniciarTelemetria();
}

async function iniciarTelemetria() {
  const [
    { NodeSDK },
    { resourceFromAttributes },
    { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION },
    { OTLPTraceExporter },
    { OTLPMetricExporter },
    { OTLPLogExporter },
    { PeriodicExportingMetricReader },
    { BatchLogRecordProcessor },
    { HttpInstrumentation },
    { ExpressInstrumentation },
    { PgInstrumentation },
    { PinoInstrumentation },
  ] = await Promise.all([
    import('@opentelemetry/sdk-node'),
    import('@opentelemetry/resources'),
    import('@opentelemetry/semantic-conventions'),
    import('@opentelemetry/exporter-trace-otlp-http'),
    import('@opentelemetry/exporter-metrics-otlp-http'),
    import('@opentelemetry/exporter-logs-otlp-http'),
    import('@opentelemetry/sdk-metrics'),
    import('@opentelemetry/sdk-logs'),
    import('@opentelemetry/instrumentation-http'),
    import('@opentelemetry/instrumentation-express'),
    import('@opentelemetry/instrumentation-pg'),
    import('@opentelemetry/instrumentation-pino'),
  ]);

  const { version } = JSON.parse(readFileSync(new URL('../package.json', import.meta.url)));
  const rotasSemTrace = new Set(['/health', '/ready']);

  const sdk = new NodeSDK({
    resource: resourceFromAttributes({
      [ATTR_SERVICE_NAME]: process.env.OTEL_SERVICE_NAME ?? 'clinix-api',
      [ATTR_SERVICE_VERSION]: version,
      'deployment.environment.name': process.env.NODE_ENV ?? 'development',
    }),
    traceExporter: new OTLPTraceExporter(),
    metricReaders: [
      new PeriodicExportingMetricReader({
        exporter: new OTLPMetricExporter(),
        exportIntervalMillis: 10_000,
      }),
    ],
    logRecordProcessors: [new BatchLogRecordProcessor({ exporter: new OTLPLogExporter() })],
    instrumentations: [
      // Health checks rodam a cada poucos segundos: só gerariam ruído nos traces.
      new HttpInstrumentation({ ignoreIncomingRequestHook: (req) => rotasSemTrace.has(req.url) }),
      new ExpressInstrumentation(),
      // Só registra queries feitas dentro de uma requisição: migrations e o
      // /ready virariam traces soltos a cada poucos segundos.
      new PgInstrumentation({ requireParentSpan: true, enhancedDatabaseReporting: false }),
      // Injeta trace_id/span_id nos logs do pino e os envia também via OTLP.
      new PinoInstrumentation(),
    ],
  });

  sdk.start();
  for (const sinal of ['SIGTERM', 'SIGINT']) {
    process.once(sinal, () => sdk.shutdown().catch(() => {}));
  }
}
