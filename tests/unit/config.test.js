import { describe, it, expect } from 'vitest';
import { carregarConfiguracao } from '../../src/config.js';

const SEGREDO = 'x'.repeat(32);
const ambienteSupabase = {
  JWT_SECRET: SEGREDO,
  SUPABASE_URL: 'https://x.supabase.co',
  SUPABASE_KEY: 'k',
};

describe('configuração', () => {
  it('lista todas as variáveis obrigatórias ausentes de uma vez', () => {
    expect(() => carregarConfiguracao({})).toThrow(/JWT_SECRET.*SUPABASE_URL.*SUPABASE_KEY/s);
  });

  it('no modo memória dispensa as credenciais do Supabase', () => {
    expect(carregarConfiguracao({ JWT_SECRET: SEGREDO, BANCO: 'memoria' }).banco).toBe('memoria');
  });

  it('recusa segredo JWT curto demais para ser seguro', () => {
    expect(() => carregarConfiguracao({ ...ambienteSupabase, JWT_SECRET: 'curto' })).toThrow(
      /JWT_SECRET/,
    );
  });

  it('aplica valores padrão sensatos', () => {
    const config = carregarConfiguracao(ambienteSupabase);

    expect(config).toMatchObject({
      porta: 3000,
      banco: 'supabase',
      fusoHorario: 'America/Sao_Paulo',
      origensCors: '*',
    });
  });

  it('aceita uma lista de origens CORS separadas por vírgula', () => {
    const config = carregarConfiguracao({
      ...ambienteSupabase,
      CORS_ORIGINS: 'https://a.com, https://b.com',
    });

    expect(config.origensCors).toEqual(['https://a.com', 'https://b.com']);
  });
});
