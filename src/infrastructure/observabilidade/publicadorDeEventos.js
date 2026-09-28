import { metrics } from '@opentelemetry/api';
import { Eventos } from '../../application/eventos.js';

/** Evento de domínio → contador OpenTelemetry (vira métrica no Prometheus). */
const CONTADORES = {
  [Eventos.HORARIO_ABERTO]: ['clinix.horarios.abertos', 'Horários abertos na agenda'],
  [Eventos.CONSULTA_AGENDADA]: ['clinix.consultas.agendadas', 'Consultas agendadas por pacientes'],
  [Eventos.CONSULTA_CANCELADA]: [
    'clinix.consultas.canceladas',
    'Consultas canceladas por pacientes',
  ],
  [Eventos.CONSULTA_REAGENDADA]: ['clinix.consultas.reagendadas', 'Cancelamentos desfeitos'],
  [Eventos.CONSULTA_REMOVIDA]: ['clinix.consultas.removidas', 'Consultas removidas pela clínica'],
  [Eventos.CONSULTA_EDITADA]: ['clinix.consultas.editadas', 'Consultas editadas pela clínica'],
  [Eventos.CONFLITO_DE_AGENDAMENTO]: [
    'clinix.consultas.conflitos',
    'Agendamentos simultâneos do mesmo horário em que um paciente perdeu a corrida',
  ],
  [Eventos.PACIENTE_CADASTRADO]: ['clinix.pacientes.cadastrados', 'Cadastros e reativações'],
  [Eventos.LOGIN]: ['clinix.logins', 'Tentativas de login, por resultado'],
};

/**
 * Implementação da porta de eventos (application/eventos.js): cada evento
 * incrementa um contador e gera uma linha de log estruturada.
 *
 * O id da consulta vai para o log (útil para investigar um caso), mas nunca
 * para a métrica: atributos de métrica precisam ter poucos valores possíveis.
 *
 * Sem o SDK do OpenTelemetry iniciado (testes, desenvolvimento), o meter
 * global é um no-op e só o log acontece.
 */
export function criarPublicadorDeEventos({ logger, meter = metrics.getMeter('clinix') }) {
  const contadores = new Map(
    Object.entries(CONTADORES).map(([tipo, [nome, description]]) => [
      tipo,
      meter.createCounter(nome, { description }),
    ]),
  );

  return {
    publicar({ tipo, idConsulta, ...atributos }) {
      contadores.get(tipo)?.add(1, atributos);
      logger.info({ evento: tipo, idConsulta, ...atributos }, `evento de domínio: ${tipo}`);
    },
  };
}
