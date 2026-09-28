import bcrypt from 'bcryptjs';
import { createHash, timingSafeEqual } from 'node:crypto';

const PARECE_HASH_BCRYPT = /^\$2[aby]\$\d{2}\$/;

/**
 * Gera e confere hashes bcrypt.
 *
 * Migração transparente (ver docs/adr/0002): a versão anterior gravava senhas
 * em texto puro. Quando o valor armazenado não é um hash bcrypt, a senha é
 * comparada diretamente e, se estiver correta, `precisaRehash` sinaliza ao
 * caso de uso que o hash deve ser gravado. Assim cada conta legada é protegida
 * no primeiro login, sem exigir troca de senha de ninguém.
 */
export function criarHasherDeSenha({ custo }) {
  return {
    gerarHash: (senha) => bcrypt.hash(senha, custo),

    async verificar(senha, armazenado) {
      if (PARECE_HASH_BCRYPT.test(armazenado)) {
        return { valida: await bcrypt.compare(senha, armazenado), precisaRehash: false };
      }
      const valida = iguaisEmTempoConstante(senha, armazenado);
      return { valida, precisaRehash: valida };
    },
  };
}

/** Compara via digest para que nem o tamanho da senha vaze pelo tempo de resposta. */
function iguaisEmTempoConstante(a, b) {
  const digest = (texto) => createHash('sha256').update(String(texto)).digest();
  return timingSafeEqual(digest(a), digest(b));
}
