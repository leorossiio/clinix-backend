import { describe, it, expect } from 'vitest';
import {
  formatarParaBanco,
  lerInstanteDoBanco,
} from '../../../src/infrastructure/tempo/fusoHorario.js';

const SP = 'America/Sao_Paulo';

describe('fuso horário na fronteira com o banco', () => {
  describe('leitura', () => {
    it('interpreta data sem fuso como horário local da clínica', () => {
      expect(lerInstanteDoBanco('2026-10-01T14:30:00', SP)).toEqual(
        new Date('2026-10-01T17:30:00Z'),
      );
    });

    it('respeita o fuso quando o banco o informa', () => {
      expect(lerInstanteDoBanco('2026-10-01T17:30:00+00:00', SP)).toEqual(
        new Date('2026-10-01T17:30:00Z'),
      );
    });

    it('aceita frações de segundo com precisão de microssegundos', () => {
      expect(lerInstanteDoBanco('2026-10-01T14:30:00.123456', SP)).toEqual(
        new Date('2026-10-01T17:30:00.123Z'),
      );
    });

    it('considera horário de verão em fusos que o adotam', () => {
      expect(lerInstanteDoBanco('2026-07-01T10:00:00', 'America/New_York')).toEqual(
        new Date('2026-07-01T14:00:00Z'),
      );
    });

    it('mantém ausência de data como null', () => {
      expect(lerInstanteDoBanco(null, SP)).toBeNull();
    });
  });

  describe('escrita', () => {
    it('grava o horário local da clínica com o deslocamento explícito', () => {
      expect(formatarParaBanco(new Date('2026-10-01T17:30:00Z'), SP)).toBe(
        '2026-10-01T14:30:00-03:00',
      );
    });

    it('ida e volta preservam o instante', () => {
      const instante = new Date('2026-12-31T23:59:00Z');

      expect(lerInstanteDoBanco(formatarParaBanco(instante, SP), SP)).toEqual(instante);
    });
  });
});
