import pg from 'pg';

const TIMESTAMP = 1114;
const TIMESTAMPTZ = 1184;

/**
 * Pool de conexões com PostgreSQL.
 *
 * Datas chegam como TEXTO: por padrão o driver interpretaria TIMESTAMP (sem
 * fuso) no fuso do processo, que no container é UTC — e a coluna guarda o
 * horário de parede da clínica. A conversão correta é feita pelo adaptador
 * (infrastructure/tempo, docs/adr/0004). A configuração vale só para este pool.
 */
export function criarPoolPostgres(url, { maximoDeConexoes = 10 } = {}) {
  return new pg.Pool({
    connectionString: url,
    max: maximoDeConexoes,
    types: {
      getTypeParser: (oid, formato) =>
        oid === TIMESTAMP || oid === TIMESTAMPTZ
          ? (valor) => valor
          : pg.types.getTypeParser(oid, formato),
    },
  });
}
