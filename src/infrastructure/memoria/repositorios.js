import { Consulta } from '../../domain/consulta/Consulta.js';
import { StatusConsulta } from '../../domain/consulta/StatusConsulta.js';
import { Notificacao } from '../../domain/notificacao/Notificacao.js';
import { Usuario, normalizarEmail } from '../../domain/usuario/Usuario.js';
import { TipoUsuario } from '../../domain/usuario/enums.js';
import { ConflitoError } from '../../domain/erros.js';

/**
 * Repositórios em memória: implementam o mesmo contrato dos repositórios do
 * Supabase (ver tests/contrato). Usados nos testes e no modo `BANCO=memoria`,
 * que permite rodar a API localmente sem nenhuma credencial.
 *
 * Guardam cópias dos dados (paraObjeto) em vez das entidades, para que alterar
 * uma entidade lida não altere o "banco" sem uma chamada explícita a atualizar().
 */
export function criarRepositoriosEmMemoria() {
  return {
    usuarios: new RepositorioDeUsuariosEmMemoria(),
    consultas: new RepositorioDeConsultasEmMemoria(),
    notificacoes: new RepositorioDeNotificacoesEmMemoria(),
    verificarConexao: async () => true,
  };
}

class Tabela {
  #linhas = new Map();

  gravar(entidade) {
    this.#linhas.set(entidade.id, structuredClone(entidade.paraObjeto()));
  }
  ler(id) {
    const linha = this.#linhas.get(id);
    return linha ? structuredClone(linha) : null;
  }
  filtrar(predicado) {
    return [...this.#linhas.values()].filter(predicado).map((linha) => structuredClone(linha));
  }
}

class RepositorioDeUsuariosEmMemoria {
  #tabela = new Tabela();

  async inserir(usuario) {
    if (await this.buscarPorEmail(usuario.email)) throw new ConflitoError('E-mail já cadastrado.');
    this.#tabela.gravar(usuario);
  }
  async atualizar(usuario) {
    this.#tabela.gravar(usuario);
  }
  async buscarPorId(id) {
    return reconstituirUsuario(this.#tabela.ler(id));
  }
  async buscarPorEmail(email) {
    const alvo = normalizarEmail(email);
    const [linha] = this.#tabela.filtrar((u) => normalizarEmail(u.email) === alvo);
    return reconstituirUsuario(linha);
  }
  async buscarVarios(ids) {
    return this.#tabela.filtrar((u) => ids.includes(u.id)).map(reconstituirUsuario);
  }
  async listarAtivos() {
    return this.#tabela.filtrar((u) => Usuario.reconstituir(u).estaAtivo).map(reconstituirUsuario);
  }
  async listarMedicosAtivos() {
    return (await this.listarAtivos()).filter((u) => u.tipo === TipoUsuario.MEDICO);
  }
}

class RepositorioDeConsultasEmMemoria {
  #tabela = new Tabela();

  async inserir(consulta) {
    this.#tabela.gravar(consulta);
  }
  async atualizar(consulta, { statusAnterior }) {
    // Mesmo controle de concorrência otimista do adaptador Supabase.
    if (this.#tabela.ler(consulta.id)?.status !== statusAnterior) {
      throw new ConflitoError('A consulta foi alterada por outra pessoa. Atualize a página.');
    }
    this.#tabela.gravar(consulta);
  }
  async buscarPorId(id) {
    return reconstituirConsulta(this.#tabela.ler(id));
  }
  async listarTodas() {
    return this.#tabela.filtrar(() => true).map(reconstituirConsulta);
  }
  async listarPorMedico(idMedico) {
    return this.#tabela.filtrar((c) => c.idMedico === idMedico).map(reconstituirConsulta);
  }
  async listarPorPaciente(idPaciente) {
    return this.#tabela.filtrar((c) => c.idPaciente === idPaciente).map(reconstituirConsulta);
  }
  async listarDisponiveisAPartirDe(instante) {
    return this.#tabela
      .filtrar((c) => c.status === StatusConsulta.DISPONIVEL && c.data >= instante)
      .map(reconstituirConsulta);
  }
}

class RepositorioDeNotificacoesEmMemoria {
  #tabela = new Tabela();

  async inserir(notificacao) {
    this.#tabela.gravar(notificacao);
  }
  async listarPorConsulta(idConsulta) {
    return this.#tabela
      .filtrar((n) => n.idConsulta === idConsulta)
      .map((n) => Notificacao.reconstituir(n));
  }
}

const reconstituirUsuario = (linha) => (linha ? Usuario.reconstituir(linha) : null);
const reconstituirConsulta = (linha) => (linha ? Consulta.reconstituir(linha) : null);
