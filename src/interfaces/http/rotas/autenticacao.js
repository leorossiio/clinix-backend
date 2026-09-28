import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { esquemas } from '../esquemas.js';
import { validar } from '../middlewares.js';
import { apresentarUsuario } from '../apresentadores.js';

export function rotasDeAutenticacao({ servicos, config }) {
  const rotas = Router();

  // Freia tentativas de adivinhar senhas: N tentativas por IP a cada 15 minutos.
  const limitarTentativas = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: config.tentativasDeLoginPor15Min,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: { error: 'Muitas tentativas de login. Aguarde alguns minutos.' },
  });

  rotas.post('/login', limitarTentativas, validar({ body: esquemas.login }), async (req, res) => {
    const { token, usuario } = await servicos.autenticacao.entrar(req.validado.body);
    res.json({ token, usuario: apresentarUsuario(usuario) });
  });

  return rotas;
}
