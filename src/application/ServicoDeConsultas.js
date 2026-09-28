import { Consulta } from '../domain/consulta/Consulta.js';
import { consultaReagendavel } from '../domain/consulta/politicaDeReagendamento.js';
import { exigirInstanteLivre } from '../domain/consulta/agenda.js';
import { TipoUsuario } from '../domain/usuario/enums.js';
import { AcessoNegadoError, NaoEncontradoError, RegraDeNegocioError } from '../domain/erros.js';
import { exigirGestaoDaConsulta, podeVerConsulta } from './autorizacao.js';

/**
 * Consulta pronta para exibição: a entidade mais os participantes e se o
 * solicitante pode reagendá-la. Evita que o frontend faça uma requisição
 * por médico/paciente (o antigo problema N+1 da tela inicial).
 *
 * @typedef {{
 *   consulta: Consulta,
 *   medico: import('../domain/usuario/Usuario.js').Usuario | null,
 *   paciente: import('../domain/usuario/Usuario.js').Usuario | null,
 *   reagendavel: boolean,
 * }} VisaoDaConsulta
 */

export class ServicoDeConsultas {
  #consultas;
  #usuarios;
  #relogio;
  #gerarId;

  constructor({ consultas, usuarios, relogio, gerarId }) {
    this.#consultas = consultas;
    this.#usuarios = usuarios;
    this.#relogio = relogio;
    this.#gerarId = gerarId;
  }

  /**
   * Cada perfil vê um recorte diferente:
   *  - admin: todas as consultas;
   *  - médico: a própria agenda;
   *  - paciente: horários livres futuros + as próprias consultas (qualquer status).
   *
   * @returns {Promise<VisaoDaConsulta[]>} da data mais distante para a mais próxima
   */
  async listar(solicitante) {
    const agora = this.#relogio.agora();
    let consultas;
    let reagendavel = null;

    if (solicitante.tipo === TipoUsuario.ADMIN) {
      consultas = await this.#consultas.listarTodas();
    } else if (solicitante.tipo === TipoUsuario.MEDICO) {
      consultas = await this.#consultas.listarPorMedico(solicitante.id);
    } else {
      const [livres, proprias] = await Promise.all([
        this.#consultas.listarDisponiveisAPartirDe(agora),
        this.#consultas.listarPorPaciente(solicitante.id),
      ]);
      // A versão anterior podia gravar horário livre mantendo o id do último
      // paciente; sem deduplicar, esse horário apareceria duas vezes.
      consultas = [...new Map([...livres, ...proprias].map((c) => [c.id, c])).values()];
      reagendavel = consultaReagendavel(proprias, solicitante.id, agora);
    }

    consultas.sort((a, b) => b.data - a.data);
    return this.#montarVisoes(consultas, (consulta) => consulta.id === reagendavel?.id);
  }

  async obter(id, solicitante) {
    const consulta = await this.#carregar(id);
    if (!podeVerConsulta(solicitante, consulta))
      throw new NaoEncontradoError('Consulta não encontrada.');
    return this.#visao(consulta);
  }

  /** Médico abre horário na própria agenda; admin, na agenda do médico informado. */
  async abrirHorario({ idMedico, data, descricao }, solicitante) {
    const idDoMedico = await this.#resolverMedico(idMedico, solicitante);
    exigirInstanteLivre(await this.#consultas.listarPorMedico(idDoMedico), data);
    const consulta = Consulta.abrirHorario(
      { id: this.#gerarId(), idMedico: idDoMedico, data, descricao },
      this.#relogio.agora(),
    );
    await this.#consultas.inserir(consulta);
    return this.#visao(consulta);
  }

  editar(id, alteracoes, solicitante) {
    return this.#alterar(id, async (consulta, agora) => {
      exigirGestaoDaConsulta(solicitante, consulta);
      if (alteracoes.data) {
        const agenda = await this.#consultas.listarPorMedico(consulta.idMedico);
        exigirInstanteLivre(agenda, alteracoes.data, { exceto: consulta.id });
      }
      consulta.editar(alteracoes, agora);
    });
  }

  remover(id, solicitante) {
    return this.#alterar(id, (consulta, agora) => {
      exigirGestaoDaConsulta(solicitante, consulta);
      consulta.removerPelaClinica(agora);
    });
  }

  agendar(id, solicitante) {
    return this.#alterar(id, (consulta, agora) => consulta.agendar(solicitante.id, agora));
  }

  cancelar(id, motivo, solicitante) {
    return this.#alterar(id, (consulta, agora) =>
      consulta.cancelarPeloPaciente(solicitante.id, motivo, agora),
    );
  }

  reagendar(id, solicitante) {
    return this.#alterar(id, async (consulta, agora) => {
      // Se a própria consulta já tem um impedimento (prazo, dono...), deixamos
      // a entidade explicar qual é. Só então checamos a regra entre consultas.
      if (consulta.podeSerReagendadaPor(solicitante.id, agora)) {
        const doPaciente = await this.#consultas.listarPorPaciente(solicitante.id);
        if (consultaReagendavel(doPaciente, solicitante.id, agora)?.id !== consulta.id) {
          throw new RegraDeNegocioError('Só é possível desfazer o cancelamento mais recente.');
        }
      }
      consulta.reagendar(solicitante.id, agora);
    });
  }

  /** Carrega, aplica a operação de domínio e grava com checagem de concorrência. */
  async #alterar(id, operacao) {
    const consulta = await this.#carregar(id);
    const statusAnterior = consulta.status;
    await operacao(consulta, this.#relogio.agora());
    await this.#consultas.atualizar(consulta, { statusAnterior });
    return this.#visao(consulta);
  }

  async #carregar(id) {
    const consulta = await this.#consultas.buscarPorId(id);
    if (!consulta) throw new NaoEncontradoError('Consulta não encontrada.');
    return consulta;
  }

  async #resolverMedico(idMedico, solicitante) {
    if (solicitante.tipo === TipoUsuario.MEDICO) {
      if (idMedico && idMedico !== solicitante.id) {
        throw new AcessoNegadoError('Médicos só podem abrir horários na própria agenda.');
      }
      return solicitante.id;
    }
    if (!idMedico) throw new RegraDeNegocioError('Informe o médico da consulta.');
    const medico = await this.#usuarios.buscarPorId(idMedico);
    if (!medico?.estaAtivo || !medico.ehMedico) {
      throw new RegraDeNegocioError('O usuário informado não é um médico ativo.');
    }
    return medico.id;
  }

  async #visao(consulta) {
    const [visao] = await this.#montarVisoes([consulta], () => false);
    return visao;
  }

  /** Busca todos os participantes em UMA consulta ao repositório. */
  async #montarVisoes(consultas, ehReagendavel) {
    const ids = [...new Set(consultas.flatMap((c) => [c.idMedico, c.idPaciente]).filter(Boolean))];
    const participantes = new Map((await this.#usuarios.buscarVarios(ids)).map((u) => [u.id, u]));
    return consultas.map((consulta) => ({
      consulta,
      medico: participantes.get(consulta.idMedico) ?? null,
      paciente: participantes.get(consulta.idPaciente) ?? null,
      reagendavel: ehReagendavel(consulta),
    }));
  }
}
