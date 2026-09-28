import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import swaggerUi from 'swagger-ui-express';
import { readFileSync } from 'node:fs';
import { parse as parseYaml } from 'yaml';
import { autenticar, rotaNaoEncontrada, tratarErros } from './middlewares.js';
import { rotasDeAutenticacao } from './rotas/autenticacao.js';
import { rotasDeUsuarios } from './rotas/usuarios.js';
import { rotasDeConsultas } from './rotas/consultas.js';
import { rotasDeNotificacoes } from './rotas/notificacoes.js';

const especificacaoOpenApi = parseYaml(
  readFileSync(new URL('../../../docs/openapi.yaml', import.meta.url), 'utf8'),
);

/**
 * Cria o app Express sem abrir porta — quem chama decide (server.js escuta;
 * os testes usam supertest direto). Express 5 encaminha erros de handlers
 * async para `tratarErros` automaticamente, então as rotas não usam try/catch.
 */
export function criarApp({ servicos }, config) {
  const app = express();

  app.set('trust proxy', config.proxiesConfiaveis);
  app.disable('x-powered-by');
  app.use(helmet());
  app.use(cors({ origin: config.origensCors }));
  app.use(express.json({ limit: '100kb' }));

  app.get('/health', (_req, res) => res.json({ status: 'ok' }));
  app.get('/', (_req, res) => res.redirect('/api-docs'));
  app.use(
    '/api-docs',
    swaggerUi.serve,
    swaggerUi.setup(especificacaoOpenApi, {
      customSiteTitle: 'Clinix API',
      swaggerOptions: {
        persistAuthorization: true,
        docExpansion: 'list',
        displayRequestDuration: true,
      },
    }),
  );

  const dependencias = { servicos, config, autenticado: autenticar(servicos.autenticacao) };
  app.use('/auth', rotasDeAutenticacao(dependencias));
  app.use('/usuarios', rotasDeUsuarios(dependencias));
  app.use('/consultas', rotasDeConsultas(dependencias));
  app.use('/notificacoes', rotasDeNotificacoes(dependencias));

  app.use(rotaNaoEncontrada);
  app.use(tratarErros);
  return app;
}
