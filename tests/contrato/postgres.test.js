import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { criarPoolPostgres } from '../../src/infrastructure/postgres/pool.js';
import { migrar } from '../../src/infrastructure/postgres/migrador.js';
import { criarRepositoriosPostgres } from '../../src/infrastructure/postgres/repositorios.js';
import { verificarContratoDosRepositorios } from './repositorios.contrato.js';

/**
 * Roda com um PostgreSQL de teste (os testes gravam dados):
 *   POSTGRES_TEST_URL=postgres://usuario:senha@localhost:5432/banco npm test
 * O Jenkins sobe um container efêmero e define essa variável.
 */
const url = process.env.POSTGRES_TEST_URL;

describe.skipIf(!url)('PostgreSQL (banco de teste)', () => {
  const pool = url ? criarPoolPostgres(url) : null;

  beforeAll(() => migrar(pool));
  afterAll(() => pool?.end());

  it('aplicar as migrations de novo não refaz nenhuma', async () => {
    const aplicadas = await migrar(pool);

    expect(aplicadas).toEqual([]);
  });

  it('responde à verificação de saúde', async () => {
    const repositorios = criarRepositoriosPostgres(pool, { fusoHorario: 'America/Sao_Paulo' });

    await expect(repositorios.verificarConexao()).resolves.toBe(true);
  });

  verificarContratoDosRepositorios('postgres', () =>
    criarRepositoriosPostgres(pool, { fusoHorario: 'America/Sao_Paulo' }),
  );
});
