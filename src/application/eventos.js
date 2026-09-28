/**
 * Porta de saída para fatos relevantes do negócio (eventos de domínio).
 *
 * Os casos de uso publicam o que ACONTECEU; quem decide o que fazer com isso
 * é a infraestrutura — hoje, contar como métrica e registrar em log
 * (infrastructure/observabilidade/publicadorDeEventos.js). Assim a aplicação
 * não depende de OpenTelemetry, e os testes usam um dublê que só coleta.
 *
 * Os eventos nunca carregam dados pessoais (nome, e-mail): só ids e
 * atributos de baixa cardinalidade, seguros para métricas.
 *
 * @typedef {{ tipo: string } & Record<string, string | number | boolean | undefined>} EventoDeDominio
 * @typedef {{ publicar(evento: EventoDeDominio): void }} PublicadorDeEventos
 */

export const Eventos = Object.freeze({
  HORARIO_ABERTO: 'horario.aberto',
  CONSULTA_AGENDADA: 'consulta.agendada',
  CONSULTA_CANCELADA: 'consulta.cancelada',
  CONSULTA_REAGENDADA: 'consulta.reagendada',
  CONSULTA_REMOVIDA: 'consulta.removida',
  CONSULTA_EDITADA: 'consulta.editada',
  /** Dois pacientes tentaram o mesmo horário ao mesmo tempo; um deles perdeu. */
  CONFLITO_DE_AGENDAMENTO: 'consulta.conflito',
  PACIENTE_CADASTRADO: 'paciente.cadastrado',
  LOGIN: 'login',
});

/** @type {PublicadorDeEventos} */
export const publicadorNulo = Object.freeze({ publicar() {} });
