import { AcessoNegadoError, RegraDeNegocioError } from '../erros.js';
import { StatusConsulta } from './StatusConsulta.js';

const UMA_HORA_MS = 60 * 60 * 1000;

/** Regra CLINIXSM-50: o paciente só cancela com pelo menos 24h de antecedência. */
export const ANTECEDENCIA_MINIMA_CANCELAMENTO_MS = 24 * UMA_HORA_MS;

/** Janela em que o paciente ainda pode desfazer o próprio cancelamento. */
export const PRAZO_PARA_REAGENDAR_MS = 3 * 24 * UMA_HORA_MS;

const MOTIVO_REMOCAO_PELA_CLINICA = 'Cancelada pela clínica.';
const STATUS_ATIVOS = [StatusConsulta.DISPONIVEL, StatusConsulta.AGENDADA];

/**
 * Agregado raiz do agendamento. Um registro de consulta nasce como um horário
 * disponível aberto pela clínica e percorre o ciclo:
 *
 *   DISPONIVEL ──agendar──▶ AGENDADA ──cancelarPeloPaciente──▶ CANCELADA
 *                                ▲                                  │
 *                                └──────────── reagendar ───────────┘
 *
 *   (DISPONIVEL | AGENDADA) ──removerPelaClinica──▶ CANCELADA  (sem volta)
 *
 * Todas as regras dependentes de tempo recebem `agora` como parâmetro, para
 * que o domínio seja determinístico e testável sem relógio real.
 */
export class Consulta {
  #props;

  constructor(props) {
    this.#props = { ...props };
  }

  /** Recria uma consulta já persistida, sem reaplicar regras de criação. */
  static reconstituir(props) {
    return new Consulta(props);
  }

  static abrirHorario({ id, idMedico, data, descricao = null }, agora) {
    exigirFuturo(data, agora, 'Não é possível abrir um horário no passado.');
    return new Consulta({
      id,
      idMedico,
      idPaciente: null,
      data,
      descricao,
      status: StatusConsulta.DISPONIVEL,
      motivoCancelamento: null,
      dataCancelamento: null,
    });
  }

  /** Cópia dos dados para os repositórios persistirem. */
  paraObjeto() {
    return { ...this.#props };
  }

  get id() {
    return this.#props.id;
  }
  get idMedico() {
    return this.#props.idMedico;
  }
  get idPaciente() {
    return this.#props.idPaciente;
  }
  get data() {
    return this.#props.data;
  }
  get descricao() {
    return this.#props.descricao;
  }
  get status() {
    return this.#props.status;
  }
  get motivoCancelamento() {
    return this.#props.motivoCancelamento;
  }
  get dataCancelamento() {
    return this.#props.dataCancelamento;
  }

  agendar(idPaciente, agora) {
    this.#exigirStatus(StatusConsulta.DISPONIVEL, 'Este horário não está mais disponível.');
    exigirFuturo(this.data, agora, 'Não é possível agendar um horário que já passou.');
    this.#props.idPaciente = idPaciente;
    this.#props.status = StatusConsulta.AGENDADA;
  }

  cancelarPeloPaciente(idPaciente, motivo, agora) {
    this.#exigirStatus(StatusConsulta.AGENDADA, 'Apenas consultas agendadas podem ser canceladas.');
    this.#exigirPaciente(idPaciente);
    if (!motivo?.trim()) {
      throw new RegraDeNegocioError('Informe o motivo do cancelamento.');
    }
    if (this.data.getTime() - agora.getTime() < ANTECEDENCIA_MINIMA_CANCELAMENTO_MS) {
      throw new RegraDeNegocioError(
        'O cancelamento só é permitido com no mínimo 24 horas de antecedência.',
      );
    }
    this.#props.status = StatusConsulta.CANCELADA;
    this.#props.motivoCancelamento = motivo.trim();
    this.#props.dataCancelamento = agora;
  }

  /**
   * Desfaz o cancelamento feito pelo próprio paciente. Não verifica se este é o
   * cancelamento mais recente dele — isso envolve outras consultas e fica em
   * politicaDeReagendamento.js.
   */
  reagendar(idPaciente, agora) {
    const impedimento = this.#impedimentoParaReagendar(idPaciente, agora);
    if (impedimento) throw impedimento;
    this.#props.status = StatusConsulta.AGENDADA;
    this.#props.motivoCancelamento = null;
    this.#props.dataCancelamento = null;
  }

  podeSerReagendadaPor(idPaciente, agora) {
    return this.#impedimentoParaReagendar(idPaciente, agora) === null;
  }

  /**
   * A clínica (médico responsável ou administrador) retira a consulta da agenda.
   * Diferente do cancelamento pelo paciente, NÃO registra dataCancelamento: é a
   * ausência dessa data que impede o paciente de "reagendar" uma consulta que a
   * clínica removeu (ver docs/adr/0003).
   */
  removerPelaClinica(_agora) {
    this.#exigirAtiva();
    this.#props.status = StatusConsulta.CANCELADA;
    this.#props.motivoCancelamento = MOTIVO_REMOCAO_PELA_CLINICA;
  }

  editar({ data, descricao }, agora) {
    this.#exigirAtiva();
    if (data !== undefined) {
      exigirFuturo(data, agora, 'A consulta não pode ser movida para o passado.');
      this.#props.data = data;
    }
    if (descricao !== undefined) this.#props.descricao = descricao;
  }

  /** Disponível ou agendada: ainda ocupa um horário na agenda do médico. */
  get estaAtiva() {
    return STATUS_ATIVOS.includes(this.status);
  }

  get foiCanceladaPeloPaciente() {
    return this.status === StatusConsulta.CANCELADA && this.dataCancelamento !== null;
  }

  #impedimentoParaReagendar(idPaciente, agora) {
    if (!this.foiCanceladaPeloPaciente) {
      return new RegraDeNegocioError(
        'Apenas consultas canceladas pelo paciente podem ser reagendadas.',
      );
    }
    if (this.idPaciente !== idPaciente) {
      return new AcessoNegadoError('Esta consulta pertence a outro paciente.');
    }
    if (agora.getTime() - this.dataCancelamento.getTime() > PRAZO_PARA_REAGENDAR_MS) {
      return new RegraDeNegocioError('O prazo de 3 dias para reagendar expirou.');
    }
    if (this.data.getTime() <= agora.getTime()) {
      return new RegraDeNegocioError('O horário desta consulta já passou.');
    }
    return null;
  }

  #exigirAtiva() {
    if (!this.estaAtiva) {
      throw new RegraDeNegocioError('Esta consulta já foi encerrada.');
    }
  }

  #exigirStatus(esperado, mensagem) {
    if (this.status !== esperado) throw new RegraDeNegocioError(mensagem);
  }

  #exigirPaciente(idPaciente) {
    if (this.idPaciente !== idPaciente) {
      throw new AcessoNegadoError('Esta consulta pertence a outro paciente.');
    }
  }
}

function exigirFuturo(data, agora, mensagem) {
  if (data.getTime() <= agora.getTime()) throw new RegraDeNegocioError(mensagem);
}
