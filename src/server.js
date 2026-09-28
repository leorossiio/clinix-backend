import { existsSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
import { carregarConfiguracao } from './config.js';
import { montarDependencias } from './container.js';
import { criarApp } from './interfaces/http/app.js';
import { semearDadosDeDemonstracao } from './infrastructure/memoria/dadosDeDemonstracao.js';

/**
 * Ponto de entrada do processo.
 *   npm start              → usa o Supabase (variáveis do .env ou do ambiente)
 *   npm run dev:memoria    → banco em memória com dados de demonstração
 */
if (existsSync('.env')) process.loadEnvFile('.env');

const config = carregarConfiguracao(variaveisDeAmbiente());
const dependencias = montarDependencias(config);

if (config.banco === 'memoria') {
  await semearDadosDeDemonstracao(dependencias);
  console.warn(
    '⚠️  BANCO=memoria: dados de demonstração, apagados ao reiniciar. Senha de todos: clinix123',
  );
}

const servidor = criarApp(dependencias, config).listen(config.porta, () => {
  console.info(`✅ Clinix API em http://localhost:${config.porta} (banco: ${config.banco})`);
  console.info(`📄 Documentação em http://localhost:${config.porta}/api-docs`);
});

// Plataformas de deploy enviam SIGTERM antes de parar o container: termina as
// requisições em andamento em vez de derrubá-las.
for (const sinal of ['SIGTERM', 'SIGINT']) {
  process.on(sinal, () => servidor.close(() => process.exit(0)));
}

function variaveisDeAmbiente() {
  if (!process.argv.includes('--memoria')) return process.env;
  // No modo demonstração, um segredo efêmero basta: os dados somem ao reiniciar.
  return { JWT_SECRET: randomBytes(32).toString('hex'), ...process.env, BANCO: 'memoria' };
}
