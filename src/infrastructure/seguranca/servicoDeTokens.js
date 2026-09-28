import jwt from 'jsonwebtoken';

const ALGORITMO = 'HS256';

/**
 * Emite e valida JWTs. O token carrega só o id (claim `sub`) e o perfil, este
 * último apenas para o frontend decidir o que exibir: o backend sempre relê o
 * perfil do banco (ver ServicoDeAutenticacao.identificar).
 */
export function criarServicoDeTokens({ segredo, expiracao }) {
  return {
    emitir: (usuario) =>
      jwt.sign({ tipo: usuario.tipo }, segredo, {
        subject: usuario.id,
        expiresIn: expiracao,
        algorithm: ALGORITMO,
      }),

    /** @returns {string | null} o id do usuário, ou null se o token for inválido/expirado. */
    verificar(token) {
      try {
        return jwt.verify(token, segredo, { algorithms: [ALGORITMO] }).sub ?? null;
      } catch {
        return null;
      }
    },
  };
}
