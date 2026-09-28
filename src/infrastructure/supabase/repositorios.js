import { StatusConsulta } from '../../domain/consulta/StatusConsulta.js';
import { normalizarEmail } from '../../domain/usuario/Usuario.js';
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
 * Adaptadores do Supabase (PostgREST). É o ÚNICO lugar que conhece nomes de
 * tabelas e colunas — o resto da aplicação só enxerga entidades de domínio.
 *
 * O contrato está em tests/contrato/repositorios.contrato.js.
 */
export function criarRepositoriosSupabase(cliente, { fusoHorario }) {
  const tempo = {
    ler: (valor) => lerInstanteDoBanco(valor, fusoHorario),
    gravar: (instante) => formatarParaBanco(instante, fusoHorario),
  };
  return {
    usuarios: new RepositorioDeUsuariosSupabase(cliente),
    consultas: new RepositorioDeConsultasSupabase(cliente, tempo),
    notificacoes: new RepositorioDeNotificacoesSupabase(cliente, tempo),
    verificarConexao: async () => {
      resultado(await cliente.from('usuario').select('id_usuario').limit(1));
      return true;
    },
  };
}

const VIOLACAO_DE_UNICIDADE = '23505';

/** Converte o { data, error } do supabase-js em retorno ou exceção. */
function resultado({ data, error }) {
  if (!error) return data;
  if (error.code === VIOLACAO_DE_UNICIDADE) throw new ConflitoError('Registro duplicado.');
  throw new Error(`Supabase: ${error.message}`, { cause: error });
}

/** Em padrões ILIKE, "_" e "%" são curingas: escapamos para comparar literalmente. */
const escaparPadraoLike = (texto) => texto.replace(/[\\%_]/g, (c) => `\\${c}`);

class RepositorioDeUsuariosSupabase {
  constructor(cliente) {
    this.tabela = () => cliente.from('usuario');
  }

  async inserir(usuario) {
    resultado(await this.tabela().insert(usuarioParaLinha(usuario)));
  }
  async atualizar(usuario) {
    const { id_usuario: id, ...colunas } = usuarioParaLinha(usuario);
    resultado(await this.tabela().update(colunas).eq('id_usuario', id));
  }
  async buscarPorId(id) {
    return linhaParaUsuario(
      resultado(await this.tabela().select('*').eq('id_usuario', id).maybeSingle()),
    );
  }
  async buscarPorEmail(email) {
    // Contas antigas podem ter e-mail com maiúsculas; por isso ILIKE e não eq.
    const linhas = resultado(
      await this.tabela()
        .select('*')
        .ilike('email', escaparPadraoLike(normalizarEmail(email)))
        .limit(1),
    );
    return linhaParaUsuario(linhas[0]);
  }
  async buscarVarios(ids) {
    if (ids.length === 0) return [];
    return resultado(await this.tabela().select('*').in('id_usuario', ids)).map(linhaParaUsuario);
  }
  async listarAtivos() {
    return resultado(
      await this.tabela().select('*').eq('status', StatusUsuario.ATIVO).order('nome'),
    ).map(linhaParaUsuario);
  }
  async listarMedicosAtivos() {
    return resultado(
      await this.tabela()
        .select('*')
        .eq('status', StatusUsuario.ATIVO)
        .eq('tipo_usuario', TipoUsuario.MEDICO)
        .order('nome'),
    ).map(linhaParaUsuario);
  }
}

class RepositorioDeConsultasSupabase {
  constructor(cliente, tempo) {
    this.tabela = () => cliente.from('consulta');
    this.tempo = tempo;
  }

  async inserir(consulta) {
    resultado(await this.tabela().insert(this.#paraLinha(consulta)));
  }

  /**
   * Concorrência otimista: só grava se o status no banco ainda for o que foi
   * lido. Se dois pacientes agendam o mesmo horário ao mesmo tempo, o segundo
   * UPDATE não encontra linha e recebe ConflitoError em vez de sobrescrever.
   */
  async atualizar(consulta, { statusAnterior }) {
    const { id_consulta: id, ...colunas } = this.#paraLinha(consulta);
    const linha = resultado(
      await this.tabela()
        .update(colunas)
        .eq('id_consulta', id)
        .eq('status', statusAnterior)
        .select('id_consulta')
        .maybeSingle(),
    );
    if (!linha)
      throw new ConflitoError('A consulta foi alterada por outra pessoa. Atualize a página.');
  }

  async buscarPorId(id) {
    return this.#paraConsulta(
      resultado(await this.tabela().select('*').eq('id_consulta', id).maybeSingle()),
    );
  }
  async listarTodas() {
    return this.#listar(this.tabela().select('*'));
  }
  async listarPorMedico(idMedico) {
    return this.#listar(this.tabela().select('*').eq('id_medico', idMedico));
  }
  async listarPorPaciente(idPaciente) {
    return this.#listar(this.tabela().select('*').eq('id_usuario', idPaciente));
  }
  async listarDisponiveisAPartirDe(instante) {
    return this.#listar(
      this.tabela()
        .select('*')
        .eq('status', StatusConsulta.DISPONIVEL)
        .gte('data', this.tempo.gravar(instante)),
    );
  }

  async #listar(consulta) {
    return resultado(await consulta).map((linha) => this.#paraConsulta(linha));
  }

  #paraLinha(consulta) {
    return consultaParaLinha(consulta, this.tempo);
  }

  #paraConsulta(linha) {
    return linhaParaConsulta(linha, this.tempo);
  }
}

class RepositorioDeNotificacoesSupabase {
  constructor(cliente, tempo) {
    this.tabela = () => cliente.from('notificacao');
    this.tempo = tempo;
  }

  async inserir(notificacao) {
    resultado(await this.tabela().insert(notificacaoParaLinha(notificacao, this.tempo)));
  }

  async listarPorConsulta(idConsulta) {
    const linhas = resultado(
      await this.tabela().select('*').eq('id_consulta', idConsulta).order('data'),
    );
    return linhas.map((linha) => linhaParaNotificacao(linha, this.tempo));
  }
}
