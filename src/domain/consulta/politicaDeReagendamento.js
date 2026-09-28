/**
 * Regra que atravessa várias consultas: o paciente só pode desfazer o seu
 * cancelamento MAIS RECENTE (e dentro do prazo). Isso evita que alguém
 * "segure" vários horários cancelando e reagendando em sequência.
 *
 * @param {import('./Consulta.js').Consulta[]} consultasDoPaciente
 * @returns {import('./Consulta.js').Consulta | null}
 */
export function consultaReagendavel(consultasDoPaciente, idPaciente, agora) {
  const maisRecente = consultasDoPaciente
    .filter((consulta) => consulta.foiCanceladaPeloPaciente && consulta.idPaciente === idPaciente)
    .reduce(
      (atual, consulta) =>
        !atual || consulta.dataCancelamento > atual.dataCancelamento ? consulta : atual,
      null,
    );

  return maisRecente?.podeSerReagendadaPor(idPaciente, agora) ? maisRecente : null;
}
