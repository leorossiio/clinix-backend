import { describe } from 'vitest';
import { criarClienteSupabase } from '../../src/infrastructure/supabase/cliente.js';
import { criarRepositoriosSupabase } from '../../src/infrastructure/supabase/repositorios.js';
import { verificarContratoDosRepositorios } from './repositorios.contrato.js';

/**
 * Só roda com um projeto Supabase DEDICADO a testes (os testes gravam dados):
 *   SUPABASE_TEST_URL=... SUPABASE_TEST_KEY=... npm test
 */
const { SUPABASE_TEST_URL: url, SUPABASE_TEST_KEY: chave } = process.env;

describe.skipIf(!url || !chave)('Supabase (banco de teste)', () => {
  const cliente = url && chave ? criarClienteSupabase({ url, chave }) : null;
  verificarContratoDosRepositorios('supabase', () =>
    criarRepositoriosSupabase(cliente, { fusoHorario: 'America/Sao_Paulo' }),
  );
});
