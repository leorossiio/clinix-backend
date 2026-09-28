import { RegraDeNegocioError } from '../erros.js';

/**
 * Regra CLINIXSM-45: um médico não pode ter duas consultas ativas começando no
 * mesmo instante. Consultas canceladas não ocupam a agenda.
 *
 * @param {import('./Consulta.js').Consulta[]} agendaDoMedico
 * @param {Date} data
 * @param {{ exceto?: string }} [opcoes] id da própria consulta, ao editá-la
 */
export function exigirInstanteLivre(agendaDoMedico, data, { exceto } = {}) {
  const ocupado = agendaDoMedico.some(
    (consulta) =>
      consulta.id !== exceto && consulta.estaAtiva && consulta.data.getTime() === data.getTime(),
  );
  if (ocupado) throw new RegraDeNegocioError('O médico já tem uma consulta neste horário.');
}
