import { CredenciaisInvalidasError } from '../domain/erros.js';

/**
 * Login e identificação de quem faz cada requisição.
 *
 * Portas usadas: repositório de usuários, hasher de senha e serviço de tokens.
 */
export class ServicoDeAutenticacao {
  #usuarios;
  #hasher;
  #tokens;
  #hashFicticio;

  constructor({ usuarios, hasher, tokens }) {
    this.#usuarios = usuarios;
    this.#hasher = hasher;
    this.#tokens = tokens;
  }

  async entrar({ email, senha }) {
    const usuario = await this.#usuarios.buscarPorEmail(email);

    if (!usuario?.estaAtivo) {
      // Gasta o mesmo tempo de um bcrypt real, para que a latência da resposta
      // não revele se o e-mail existe.
      await this.#hasher.verificar(senha, await this.#obterHashFicticio());
      throw new CredenciaisInvalidasError();
    }

    const { valida, precisaRehash } = await this.#hasher.verificar(senha, usuario.senhaHash);
    if (!valida) throw new CredenciaisInvalidasError();

    if (precisaRehash) {
      usuario.atualizarDados({ senhaHash: await this.#hasher.gerarHash(senha) });
      await this.#usuarios.atualizar(usuario);
    }

    return { token: this.#tokens.emitir(usuario), usuario };
  }

  /**
   * Valida o token E confere no banco se o usuário continua ativo: uma conta
   * excluída perde o acesso imediatamente, sem esperar o token expirar.
   * O perfil também vem do banco, então mudanças de perfil valem na hora.
   *
   * @returns {Promise<import('./autorizacao.js').Solicitante | null>}
   */
  async identificar(token) {
    const idUsuario = this.#tokens.verificar(token);
    if (!idUsuario) return null;
    const usuario = await this.#usuarios.buscarPorId(idUsuario);
    return usuario?.estaAtivo ? { id: usuario.id, tipo: usuario.tipo } : null;
  }

  async #obterHashFicticio() {
    this.#hashFicticio ??= await this.#hasher.gerarHash('senha-ficticia-para-equalizar-tempo');
    return this.#hashFicticio;
  }
}
