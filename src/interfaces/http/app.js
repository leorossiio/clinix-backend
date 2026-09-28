import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import swaggerUi from 'swagger-ui-express';
import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { pinoHttp } from 'pino-http';
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
export function criarApp({ servicos, logger, verificarConexao }, config) {
  const app = express();

  app.set('trust proxy', config.proxiesConfiaveis);
  app.disable('x-powered-by');
  app.use(registrarRequisicoes(logger));
  app.use(helmet());
  app.use(cors({ origin: config.origensCors, exposedHeaders: ['x-request-id'] }));
  app.use(express.json({ limit: '100kb' }));

  // Liveness: o processo está de pé. Readiness: consegue atender (alcança o banco).
  app.get('/health', (_req, res) => res.json({ status: 'ok' }));
  app.get('/ready', async (req, res) => {
    try {
      await verificarConexao();
      res.json({ status: 'pronto' });
    } catch (erro) {
      req.log.warn({ err: erro }, 'banco indisponível');
      res.status(503).json({ status: 'indisponivel' });
    }
  });
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

const ID_DE_REQUISICAO_VALIDO = /^[\w-]{1,64}$/;
const SEM_LOG_DE_ACESSO = new Set(['/health', '/ready']);

/**
 * Log de acesso estruturado e id de correlação. O id vem do proxy (nginx)
 * quando existe, ou é gerado aqui; volta no header x-request-id e aparece em
 * todas as linhas de log da requisição.
 */
function registrarRequisicoes(logger) {
  return pinoHttp({
    logger,
    genReqId(req, res) {
      const recebido = req.headers['x-request-id'];
      const id =
        typeof recebido === 'string' && ID_DE_REQUISICAO_VALIDO.test(recebido)
          ? recebido
          : randomUUID();
      res.setHeader('x-request-id', id);
      return id;
    },
    autoLogging: { ignore: (req) => SEM_LOG_DE_ACESSO.has(req.url) },
    customLogLevel: (_req, res, erro) =>
      erro || res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info',
    customSuccessMessage: (req, res) => `${req.method} ${req.originalUrl} ${res.statusCode}`,
    customErrorMessage: (req, res) => `${req.method} ${req.originalUrl} ${res.statusCode}`,
    serializers: {
      req: (req) => ({ id: req.id, method: req.method, url: req.url }),
      res: (res) => ({ statusCode: res.statusCode }),
    },
  });
}
