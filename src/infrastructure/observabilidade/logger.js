import pino from 'pino';

/**
 * Logs estruturados em JSON (um objeto por linha), prontos para o Loki.
 * Quando o OpenTelemetry está ativo, a instrumentação do pino acrescenta
 * trace_id e span_id a cada linha: do log se chega ao trace e vice-versa.
 */
export function criarLogger({ nivel = 'info', servico = 'clinix-api' } = {}) {
  return pino({
    level: nivel,
    base: { service: servico },
    timestamp: pino.stdTimeFunctions.isoTime,
    formatters: { level: (rotulo) => ({ level: rotulo }) },
    // Credenciais nunca vão para o log, nem por acidente.
    redact: {
      paths: [
        'req.headers.authorization',
        'req.headers.cookie',
        '*.senha',
        '*.senhaHash',
        '*.token',
      ],
      censor: '[oculto]',
    },
  });
}
