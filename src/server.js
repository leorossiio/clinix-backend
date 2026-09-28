import { existsSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
import { carregarConfiguracao } from './config.js';
import { montarDependencias } from './container.js';
import { criarApp } from './interfaces/http/app.js';
import { semearDadosDeDemonstracao } from './infrastructure/memoria/dadosDeDemonstracao.js';

/**
 * Ponto de entrada do processo.
 *   npm start              → banco definido por BANCO (supabase | postgres | memoria)
 *   npm run dev:memoria    → banco em memória com dados de demonstração
 *
 * A telemetria (OpenTelemetry) é carregada antes deste arquivo, via
 * `node --import ./src/instrumentacao.js` — ver instrumentacao.js.
 */
if (existsSync('.env')) process.loadEnvFile('.env');

const config = carregarConfiguracao(variaveisDeAmbiente());
const dependencias = montarDependencias(config);
const { logger } = dependencias;

const migrationsAplicadas = await dependencias.prepararBanco();
if (migrationsAplicadas.length > 0) logger.info({ migrationsAplicadas }, 'schema atualizado');

if (config.banco === 'memoria' || config.semearDemonstracao) {
  if (await semearDadosDeDemonstracao(dependencias)) {
    logger.warn('dados de demonstração criados; a senha de todos os usuários é clinix123');
  }
}

const servidor = criarApp(dependencias, config).listen(config.porta, () => {
  logger.info(
    { porta: config.porta, banco: config.banco },
    `Clinix API em http://localhost:${config.porta} (documentação em /api-docs)`,
  );
});

// Plataformas de deploy enviam SIGTERM antes de parar o container: termina as
// requisições em andamento e fecha as conexões com o banco.
for (const sinal of ['SIGTERM', 'SIGINT']) {
  process.on(sinal, () => {
    logger.info({ sinal }, 'encerrando');
    servidor.close(async () => {
      await dependencias.encerrar();
      process.exit(0);
    });
  });
}

function variaveisDeAmbiente() {
  if (!process.argv.includes('--memoria')) return process.env;
  // No modo demonstração, um segredo efêmero basta: os dados somem ao reiniciar.
  return { JWT_SECRET: randomBytes(32).toString('hex'), ...process.env, BANCO: 'memoria' };
}
