import { Usuario } from '../domain/usuario/Usuario.js';
import { ConflitoError, NaoEncontradoError, RegraDeNegocioError } from '../domain/erros.js';
import { exigirProprioUsuarioOuAdmin } from './autorizacao.js';

export class ServicoDeUsuarios {
  #usuarios;
  #hasher;
  #gerarId;

  constructor({ usuarios, hasher, gerarId }) {
    this.#usuarios = usuarios;
    this.#hasher = hasher;
    this.#gerarId = gerarId;
  }

  /** @returns {Promise<{ usuario: Usuario, reativado: boolean }>} */
  async registrarPaciente({ nome, email, senha }) {
    const senhaHash = await this.#hasher.gerarHash(senha);
    const existente = await this.#usuarios.buscarPorEmail(email);

    if (existente) {
      existente.reativarComoPaciente({ nome, senhaHash });
      await this.#usuarios.atualizar(existente);
      return { usuario: existente, reativado: true };
    }

    const usuario = Usuario.registrarPaciente({ id: this.#gerarId(), nome, email, senhaHash });
    await this.#usuarios.inserir(usuario);
    return { usuario, reativado: false };
  }

  listarAtivos() {
    return this.#usuarios.listarAtivos();
  }

  listarMedicos() {
    return this.#usuarios.listarMedicosAtivos();
  }

  async obter(id, solicitante) {
    exigirProprioUsuarioOuAdmin(solicitante, id);
    return this.#carregarAtivo(id);
  }

  async atualizar(id, { nome, email, senha }, solicitante) {
    exigirProprioUsuarioOuAdmin(solicitante, id);
    const usuario = await this.#carregarAtivo(id);

    if (email !== undefined) {
      const dono = await this.#usuarios.buscarPorEmail(email);
      if (dono && dono.id !== id) throw new ConflitoError('Este e-mail já está em uso.');
    }
    const senhaHash = senha === undefined ? undefined : await this.#hasher.gerarHash(senha);

    usuario.atualizarDados({ nome, email, senhaHash });
    await this.#usuarios.atualizar(usuario);
    return usuario;
  }

  async excluir(id, solicitante) {
    if (id === solicitante.id) {
      throw new RegraDeNegocioError('Você não pode excluir a própria conta.');
    }
    const usuario = await this.#carregarAtivo(id);
    usuario.excluir();
    await this.#usuarios.atualizar(usuario);
  }

  async #carregarAtivo(id) {
    const usuario = await this.#usuarios.buscarPorId(id);
    if (!usuario?.estaAtivo) throw new NaoEncontradoError('Usuário não encontrado.');
    return usuario;
  }
}
