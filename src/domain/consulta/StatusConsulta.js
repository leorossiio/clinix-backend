/**
 * Ciclo de vida de uma consulta. Os valores numéricos são os gravados no banco
 * (coluna consulta.status) e expostos na API — não altere sem migrar os dados.
 */
export const StatusConsulta = Object.freeze({
  DISPONIVEL: 0,
  AGENDADA: 1,
  CONCLUIDA: 2,
  CANCELADA: 3,
});
