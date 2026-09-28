import { readdir, readFile } from 'node:fs/promises';

const PASTA_DAS_MIGRATIONS = new URL('../../../database/migrations/', import.meta.url);
/** Chave arbitrária do lock: impede duas instâncias da API de migrarem ao mesmo tempo. */
const CHAVE_DO_LOCK = 72_630_115;

/**
 * Aplica, em ordem, os arquivos de database/migrations ainda não aplicados,
 * cada um numa transação, registrando-os em schema_migrations.
 *
 * @returns {Promise<string[]>} nomes das migrations aplicadas nesta execução
 */
export async function migrar(pool) {
  const cliente = await pool.connect();
  try {
    await cliente.query('SELECT pg_advisory_lock($1)', [CHAVE_DO_LOCK]);
    await cliente.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        versao TEXT PRIMARY KEY,
        aplicada_em TIMESTAMPTZ NOT NULL DEFAULT now()
      )`);
    const { rows } = await cliente.query('SELECT versao FROM schema_migrations');
    const jaAplicadas = new Set(rows.map((linha) => linha.versao));

    const pendentes = (await readdir(PASTA_DAS_MIGRATIONS))
      .filter((arquivo) => arquivo.endsWith('.sql') && !jaAplicadas.has(arquivo))
      .sort();

    for (const arquivo of pendentes) {
      const sql = await readFile(new URL(arquivo, PASTA_DAS_MIGRATIONS), 'utf8');
      await cliente.query('BEGIN');
      try {
        await cliente.query(sql);
        await cliente.query('INSERT INTO schema_migrations (versao) VALUES ($1)', [arquivo]);
        await cliente.query('COMMIT');
      } catch (erro) {
        await cliente.query('ROLLBACK');
        throw new Error(`Falha ao aplicar a migration ${arquivo}: ${erro.message}`, {
          cause: erro,
        });
      }
    }
    return pendentes;
  } finally {
    await cliente.query('SELECT pg_advisory_unlock($1)', [CHAVE_DO_LOCK]).catch(() => {});
    cliente.release();
  }
}
