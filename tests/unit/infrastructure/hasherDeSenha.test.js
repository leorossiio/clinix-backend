import { describe, it, expect } from 'vitest';
import { criarHasherDeSenha } from '../../../src/infrastructure/seguranca/hasherDeSenha.js';

// Custo baixo só para os testes ficarem rápidos; produção usa o valor da configuração.
const hasher = criarHasherDeSenha({ custo: 4 });

describe('hasher de senha', () => {
  it('nunca armazena a senha em texto puro', async () => {
    expect(await hasher.gerarHash('segredo123')).not.toContain('segredo123');
  });

  it('confere a senha correta contra o hash', async () => {
    const hash = await hasher.gerarHash('segredo123');

    expect(await hasher.verificar('segredo123', hash)).toEqual({
      valida: true,
      precisaRehash: false,
    });
  });

  it('recusa senha incorreta', async () => {
    const hash = await hasher.gerarHash('segredo123');

    expect((await hasher.verificar('outra', hash)).valida).toBe(false);
  });

  describe('senhas legadas (gravadas em texto puro pela versão anterior)', () => {
    it('aceita a senha correta e pede para gravar o hash', async () => {
      expect(await hasher.verificar('senha123', 'senha123')).toEqual({
        valida: true,
        precisaRehash: true,
      });
    });

    it('recusa senha incorreta', async () => {
      expect((await hasher.verificar('senha12', 'senha123')).valida).toBe(false);
    });
  });
});
