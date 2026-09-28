import { StatusConsulta } from '../../domain/consulta/StatusConsulta.js';
import { StatusUsuario, TipoUsuario } from '../../domain/usuario/enums.js';
import { ConflitoError } from '../../domain/erros.js';
import {
  consultaParaLinha,
  linhaParaConsulta,
  linhaParaNotificacao,
  linhaParaUsuario,
  notificacaoParaLinha,
  usuarioParaLinha,
} from '../linhas.js';
import { formatarParaBanco, lerInstanteDoBanco } from '../tempo/fusoHorario.js';

/**
 * Adaptadores para PostgreSQL com SQL parametrizado. Mesmo contrato dos
 * adaptadores Supabase e em memória (tests/contrato): trocar de banco não
 * muda uma linha do domínio nem da aplicação.
 */
export function criarRepositoriosPostgres(pool, { fusoHorario }) {
  const tempo = {
    ler: (valor) => lerInstanteDoBanco(valor, fusoHorario),
    gravar: (instante) => formatarParaBanco(instante, fusoHorario),
  };
  const executar = async (sql, parametros) => {
    try {
      return await pool.query(sql, parametros);
    } catch (erro) {
      if (erro.code === VIOLACAO_DE_UNICIDADE) throw new ConflitoError('Registro duplicado.');
      throw erro;
    }
  };

  return {
    usuarios: new RepositorioDeUsuariosPostgres(executar),
    consultas: new RepositorioDeConsultasPostgres(executar, tempo),
    notificacoes: new RepositorioDeNotificacoesPostgres(executar, tempo),
    verificarConexao: async () => (await executar('SELECT 1 AS ok')).rows[0].ok === 1,
  };
}

const VIOLACAO_DE_UNICIDADE = '23505';

const COLUNAS_USUARIO = [
  'id_usuario',
  'nome',
  'email',
  'senha',
  'tipo_usuario',
  'status',
  'especialidade',
  'crm',
];
const COLUNAS_CONSULTA = [
  'id_consulta',
  'id_medico',
  'id_usuario',
  'data',
  'descricao',
  'status',
  'motivo_cancelamento',
  'data_cancelamento',
];

/** INSERT INTO tabela (a, b) VALUES ($1, $2) a partir de uma linha já mapeada. */
function insercao(tabela, linha) {
  const colunas = Object.keys(linha);
  const marcadores = colunas.map((_, i) => `$${i + 1}`);
  return {
    sql: `INSERT INTO ${tabela} (${colunas.join(', ')}) VALUES (${marcadores.join(', ')})`,
    parametros: Object.values(linha),
  };
}

/** UPDATE que grava todas as colunas exceto a chave, que vai como $1. */
function atualizacao(tabela, chave, colunas, linha) {
  const alteraveis = colunas.filter((coluna) => coluna !== chave);
  const atribuicoes = alteraveis.map((coluna, i) => `${coluna} = $${i + 2}`);
  return {
    sql: `UPDATE ${tabela} SET ${atribuicoes.join(', ')} WHERE ${chave} = $1`,
    parametros: [linha[chave], ...alteraveis.map((coluna) => linha[coluna])],
  };
}

class RepositorioDeUsuariosPostgres {
  constructor(executar) {
    this.executar = executar;
  }

  async inserir(usuario) {
    const { sql, parametros } = insercao('usuario', usuarioParaLinha(usuario));
    await this.executar(sql, parametros);
  }
  async atualizar(usuario) {
    const linha = usuarioParaLinha(usuario);
    const { sql, parametros } = atualizacao('usuario', 'id_usuario', COLUNAS_USUARIO, linha);
    await this.executar(sql, parametros);
  }
  async buscarPorId(id) {
    return this.#um('SELECT * FROM usuario WHERE id_usuario = $1', [id]);
  }
  async buscarPorEmail(email) {
    // Igualdade sem diferenciar maiúsculas: contas antigas podem ter e-mail com maiúsculas.
    return this.#um('SELECT * FROM usuario WHERE lower(email) = lower($1) LIMIT 1', [email]);
  }
  async buscarVarios(ids) {
    if (ids.length === 0) return [];
    return this.#varios('SELECT * FROM usuario WHERE id_usuario = ANY($1::uuid[])', [ids]);
  }
  async listarAtivos() {
    return this.#varios('SELECT * FROM usuario WHERE status = $1 ORDER BY nome', [
      StatusUsuario.ATIVO,
    ]);
  }
  async listarMedicosAtivos() {
    return this.#varios(
      'SELECT * FROM usuario WHERE status = $1 AND tipo_usuario = $2 ORDER BY nome',
      [StatusUsuario.ATIVO, TipoUsuario.MEDICO],
    );
  }

  async #um(sql, parametros) {
    return linhaParaUsuario((await this.executar(sql, parametros)).rows[0]);
  }
  async #varios(sql, parametros) {
    return (await this.executar(sql, parametros)).rows.map(linhaParaUsuario);
  }
}

class RepositorioDeConsultasPostgres {
  constructor(executar, tempo) {
    this.executar = executar;
    this.tempo = tempo;
  }

  async inserir(consulta) {
    const { sql, parametros } = insercao('consulta', consultaParaLinha(consulta, this.tempo));
    await this.executar(sql, parametros);
  }

  /** Concorrência otimista: só grava se o status no banco ainda é o que foi lido. */
  async atualizar(consulta, { statusAnterior }) {
    const linha = consultaParaLinha(consulta, this.tempo);
    const { sql, parametros } = atualizacao('consulta', 'id_consulta', COLUNAS_CONSULTA, linha);
    const resultado = await this.executar(`${sql} AND status = $${parametros.length + 1}`, [
      ...parametros,
      statusAnterior,
    ]);
    if (resultado.rowCount === 0) {
      throw new ConflitoError('A consulta foi alterada por outra pessoa. Atualize a página.');
    }
  }

  async buscarPorId(id) {
    const { rows } = await this.executar('SELECT * FROM consulta WHERE id_consulta = $1', [id]);
    return linhaParaConsulta(rows[0], this.tempo);
  }
  async listarTodas() {
    return this.#varios('SELECT * FROM consulta');
  }
  async listarPorMedico(idMedico) {
    return this.#varios('SELECT * FROM consulta WHERE id_medico = $1', [idMedico]);
  }
  async listarPorPaciente(idPaciente) {
    return this.#varios('SELECT * FROM consulta WHERE id_usuario = $1', [idPaciente]);
  }
  async listarDisponiveisAPartirDe(instante) {
    return this.#varios('SELECT * FROM consulta WHERE status = $1 AND data >= $2', [
      StatusConsulta.DISPONIVEL,
      this.tempo.gravar(instante),
    ]);
  }

  async #varios(sql, parametros = []) {
    const { rows } = await this.executar(sql, parametros);
    return rows.map((linha) => linhaParaConsulta(linha, this.tempo));
  }
}

class RepositorioDeNotificacoesPostgres {
  constructor(executar, tempo) {
    this.executar = executar;
    this.tempo = tempo;
  }

  async inserir(notificacao) {
    const linha = notificacaoParaLinha(notificacao, this.tempo);
    const { sql, parametros } = insercao('notificacao', linha);
    await this.executar(sql, parametros);
  }

  async listarPorConsulta(idConsulta) {
    const { rows } = await this.executar(
      'SELECT * FROM notificacao WHERE id_consulta = $1 ORDER BY data',
      [idConsulta],
    );
    return rows.map((linha) => linhaParaNotificacao(linha, this.tempo));
  }
}
