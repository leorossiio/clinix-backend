/**
 * Conversão de datas na fronteira com o banco (ver docs/adr/0004).
 *
 * O domínio trabalha só com instantes (Date). A coluna consulta.data foi criada
 * como TIMESTAMP *sem* fuso e guarda o horário de parede da clínica. Para
 * funcionar com essa coluna — e também com TIMESTAMPTZ, caso seja migrada —:
 *
 *  - na leitura, texto sem fuso é interpretado no fuso da clínica;
 *  - na escrita, gravamos o horário de parede da clínica COM o deslocamento
 *    explícito (ex.: 14:30-03:00). TIMESTAMP ignora o deslocamento e guarda
 *    14:30; TIMESTAMPTZ o usa para calcular o instante correto.
 */

const TERMINA_COM_FUSO = /(Z|[+-]\d{2}:\d{2})$/i;
const formatadores = new Map();

export function lerInstanteDoBanco(valor, fuso) {
  if (valor === null || valor === undefined) return null;
  if (valor instanceof Date) return valor;

  const texto = normalizar(valor);
  if (TERMINA_COM_FUSO.test(texto)) return new Date(texto);

  // Trata o horário de parede como se fosse UTC e corrige pelo deslocamento do
  // fuso. A segunda passada acerta os casos em que o deslocamento muda perto
  // da transição de horário de verão.
  const paredeComoUtc = new Date(`${texto}Z`).getTime();
  const primeiraEstimativa = paredeComoUtc - deslocamentoMs(new Date(paredeComoUtc), fuso);
  return new Date(paredeComoUtc - deslocamentoMs(new Date(primeiraEstimativa), fuso));
}

export function formatarParaBanco(instante, fuso) {
  if (!instante) return null;
  const deslocamento = deslocamentoMs(instante, fuso);
  // "AAAA-MM-DDTHH:mm:ss", mais ".sss" só quando há milissegundos a preservar.
  const tamanho = instante.getMilliseconds() === 0 ? 19 : 23;
  const parede = new Date(instante.getTime() + deslocamento).toISOString().slice(0, tamanho);
  return `${parede}${formatarDeslocamento(deslocamento)}`;
}

/** Postgres pode usar espaço como separador, até 6 casas decimais e fuso "+00". */
function normalizar(texto) {
  return String(texto)
    .trim()
    .replace(' ', 'T')
    .replace(/(\.\d{3})\d+/, '$1')
    .replace(/([+-]\d{2})$/, '$1:00');
}

/** Quanto o horário de parede do fuso está à frente (+) ou atrás (-) de UTC. */
function deslocamentoMs(instante, fuso) {
  const partes = Object.fromEntries(
    formatador(fuso)
      .formatToParts(instante)
      .map(({ type, value }) => [type, Number(value)]),
  );
  const paredeComoUtc = Date.UTC(
    partes.year,
    partes.month - 1,
    partes.day,
    partes.hour,
    partes.minute,
    partes.second,
  );
  const instanteSemMs = Math.floor(instante.getTime() / 1000) * 1000;
  return paredeComoUtc - instanteSemMs;
}

function formatarDeslocamento(ms) {
  const minutosTotais = Math.round(Math.abs(ms) / 60_000);
  const horas = String(Math.floor(minutosTotais / 60)).padStart(2, '0');
  const minutos = String(minutosTotais % 60).padStart(2, '0');
  return `${ms < 0 ? '-' : '+'}${horas}:${minutos}`;
}

function formatador(fuso) {
  if (!formatadores.has(fuso)) {
    formatadores.set(
      fuso,
      new Intl.DateTimeFormat('en-US', {
        timeZone: fuso,
        hourCycle: 'h23',
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric',
      }),
    );
  }
  return formatadores.get(fuso);
}
