import {
  AcessoNegadoError,
  ConflitoError,
  CredenciaisInvalidasError,
  NaoEncontradoError,
  RegraDeNegocioError,
} from '../../domain/erros.js';

/** Entrada malformada (validação de formato). Existe só na camada HTTP. */
export class DadosInvalidosError extends Error {}

class NaoAutenticadoError extends Error {}

/** Popula req.solicitante a partir do header "Authorization: Bearer <token>". */
export function autenticar(servicoDeAutenticacao) {
  return async (req, _res, next) => {
    const [esquema, token] = req.headers.authorization?.split(' ') ?? [];
    if (esquema !== 'Bearer' || !token) {
      throw new NaoAutenticadoError('Autenticação necessária.');
    }
    req.solicitante = await servicoDeAutenticacao.identificar(token);
    if (!req.solicitante) {
      throw new NaoAutenticadoError('Sessão inválida ou expirada. Entre novamente.');
    }
    next();
  };
}

/** Restringe a rota a perfis (TipoUsuario). Deve vir depois de `autenticar`. */
export function permitir(...tipos) {
  return (req, _res, next) => {
    if (!tipos.includes(req.solicitante.tipo)) {
      throw new AcessoNegadoError('Seu perfil não tem acesso a esta operação.');
    }
    next();
  };
}

/**
 * Valida partes da requisição com esquemas Joi e guarda o resultado já
 * convertido (ex.: datas ISO viram Date) em req.validado. Os handlers leem
 * SEMPRE de req.validado, nunca de req.body cru.
 */
export function validar(esquemas) {
  return (req, _res, next) => {
    req.validado ??= {};
    for (const [parte, esquema] of Object.entries(esquemas)) {
      const { value, error } = esquema.validate(req[parte] ?? {}, { abortEarly: true });
      if (error) throw new DadosInvalidosError(error.details[0].message);
      req.validado[parte] = value;
    }
    next();
  };
}

export function rotaNaoEncontrada(_req, res) {
  res.status(404).json({ error: 'Rota não encontrada.' });
}

const STATUS_POR_ERRO = new Map([
  [DadosInvalidosError, 400],
  [NaoAutenticadoError, 401],
  [CredenciaisInvalidasError, 401],
  [AcessoNegadoError, 403],
  [NaoEncontradoError, 404],
  [ConflitoError, 409],
  [RegraDeNegocioError, 422],
]);

/**
 * Traduz erros em respostas HTTP no formato { error: "mensagem" }.
 * Erros inesperados viram 500 genérico: detalhes internos (mensagens do
 * banco, stack) vão só para o log, nunca para o cliente.
 */
// O Express só reconhece um handler de erro se ele declarar os 4 parâmetros.
export function tratarErros(erro, req, res, _next) {
  for (const [Classe, status] of STATUS_POR_ERRO) {
    if (erro instanceof Classe) return res.status(status).json({ error: erro.message });
  }
  // Erros lançados pelo body-parser do Express (JSON malformado, corpo grande demais).
  if (erro.type === 'entity.parse.failed') return res.status(400).json({ error: 'JSON inválido.' });
  if (erro.status === 413) return res.status(413).json({ error: 'Requisição grande demais.' });

  req.log.error({ err: erro }, 'erro inesperado');
  return res.status(500).json({ error: 'Erro interno. Tente novamente em instantes.' });
}
