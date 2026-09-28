import { ConflitoError, RegraDeNegocioError } from '../erros.js';
import { StatusUsuario, TipoUsuario } from './enums.js';

export const normalizarEmail = (email) => email.trim().toLowerCase();

/**
 * Pessoa com acesso ao sistema: paciente, médico ou administrador.
 *
 * A entidade guarda apenas o HASH da senha; gerar e verificar hashes é
 * responsabilidade da infraestrutura (ver seguranca/hasherDeSenha.js).
 */
export class Usuario {
  #props;

  constructor(props) {
    this.#props = { ...props };
  }

  static reconstituir(props) {
    return new Usuario(props);
  }

  /** Auto-cadastro público: sempre cria um paciente. Médicos e admins são criados pela clínica. */
  static registrarPaciente({ id, nome, email, senhaHash }) {
    return new Usuario({
      id,
      nome: exigirTexto(nome, 'Informe o nome.'),
      email: normalizarEmail(exigirTexto(email, 'Informe o e-mail.')),
      senhaHash,
      tipo: TipoUsuario.PACIENTE,
      status: StatusUsuario.ATIVO,
      especialidade: null,
      crm: null,
    });
  }

  /** Cópia dos dados para os repositórios persistirem. */
  paraObjeto() {
    return { ...this.#props };
  }

  get id() {
    return this.#props.id;
  }
  get nome() {
    return this.#props.nome;
  }
  get email() {
    return this.#props.email;
  }
  get senhaHash() {
    return this.#props.senhaHash;
  }
  get tipo() {
    return this.#props.tipo;
  }
  get status() {
    return this.#props.status;
  }
  get especialidade() {
    return this.#props.especialidade;
  }
  get crm() {
    return this.#props.crm;
  }
  get estaAtivo() {
    return this.status === StatusUsuario.ATIVO;
  }
  get ehMedico() {
    return this.tipo === TipoUsuario.MEDICO;
  }

  /**
   * Quem teve a conta excluída pode se cadastrar de novo com o mesmo e-mail:
   * o registro antigo é reaproveitado (o e-mail é único no banco), mas volta
   * como paciente — perfis de médico/admin nunca são restaurados por auto-cadastro.
   */
  reativarComoPaciente({ nome, senhaHash }) {
    if (this.estaAtivo) throw new ConflitoError('Já existe um usuário ativo com este e-mail.');
    Object.assign(this.#props, {
      nome: exigirTexto(nome, 'Informe o nome.'),
      senhaHash,
      tipo: TipoUsuario.PACIENTE,
      status: StatusUsuario.ATIVO,
      especialidade: null,
      crm: null,
    });
  }

  excluir() {
    this.#props.status = StatusUsuario.EXCLUIDO;
  }

  atualizarDados({ nome, email, senhaHash }) {
    if (nome !== undefined) this.#props.nome = exigirTexto(nome, 'Informe o nome.');
    if (email !== undefined)
      this.#props.email = normalizarEmail(exigirTexto(email, 'Informe o e-mail.'));
    if (senhaHash !== undefined) this.#props.senhaHash = senhaHash;
  }
}

function exigirTexto(valor, mensagem) {
  const texto = valor?.trim();
  if (!texto) throw new RegraDeNegocioError(mensagem);
  return texto;
}
