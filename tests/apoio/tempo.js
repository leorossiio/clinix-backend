/** Instante fixo usado como "agora" nos testes: elimina dependência do relógio real. */
export const AGORA = new Date('2026-10-01T12:00:00.000Z');

const UMA_HORA_MS = 60 * 60 * 1000;

/** Instante `horas` depois (ou antes, se negativo) de AGORA. */
export const emHoras = (horas) => new Date(AGORA.getTime() + horas * UMA_HORA_MS);

/** Relógio controlável, no mesmo formato do relógio real injetado nos serviços. */
export const relogioFixo = (instante = AGORA) => {
  let atual = instante;
  return {
    agora: () => new Date(atual),
    avancarHoras: (horas) => {
      atual = new Date(atual.getTime() + horas * UMA_HORA_MS);
    },
  };
};
