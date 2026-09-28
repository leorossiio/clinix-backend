import { describe, it, expect } from 'vitest';
import { Consulta } from '../../../src/domain/consulta/Consulta.js';
import { StatusConsulta } from '../../../src/domain/consulta/StatusConsulta.js';
import { AcessoNegadoError, RegraDeNegocioError } from '../../../src/domain/erros.js';
import { AGORA, emHoras } from '../../apoio/tempo.js';

const horarioDisponivel = (dados = {}) =>
  Consulta.abrirHorario(
    { id: 'c1', idMedico: 'medico-1', data: emHoras(48), descricao: 'Rotina', ...dados },
    AGORA,
  );

describe('Consulta', () => {
  describe('abrir horário', () => {
    it('cria um horário disponível e sem paciente', () => {
      const consulta = horarioDisponivel();

      expect(consulta.status).toBe(StatusConsulta.DISPONIVEL);
      expect(consulta.idPaciente).toBeNull();
    });

    it('recusa horário que já passou', () => {
      expect(() => horarioDisponivel({ data: emHoras(-1) })).toThrow(RegraDeNegocioError);
    });
  });

  describe('agendar', () => {
    it('reserva o horário para o paciente', () => {
      const consulta = horarioDisponivel();

      consulta.agendar('paciente-1', AGORA);

      expect(consulta.status).toBe(StatusConsulta.AGENDADA);
      expect(consulta.idPaciente).toBe('paciente-1');
    });

    it('não permite agendar horário já reservado por outro paciente', () => {
      const consulta = horarioDisponivel();
      consulta.agendar('paciente-1', AGORA);

      expect(() => consulta.agendar('paciente-2', AGORA)).toThrow(RegraDeNegocioError);
      expect(consulta.idPaciente).toBe('paciente-1');
    });

    it('não permite agendar horário que já passou', () => {
      const consulta = horarioDisponivel({ data: emHoras(1) });

      expect(() => consulta.agendar('paciente-1', emHoras(2))).toThrow(RegraDeNegocioError);
    });
  });

  describe('cancelar pelo paciente', () => {
    const agendada = (horasAteConsulta = 48) => {
      const consulta = horarioDisponivel({ data: emHoras(horasAteConsulta) });
      consulta.agendar('paciente-1', AGORA);
      return consulta;
    };

    it('cancela registrando motivo e momento do cancelamento', () => {
      const consulta = agendada();

      consulta.cancelarPeloPaciente('paciente-1', 'Imprevisto no trabalho', AGORA);

      expect(consulta.status).toBe(StatusConsulta.CANCELADA);
      expect(consulta.motivoCancelamento).toBe('Imprevisto no trabalho');
      expect(consulta.dataCancelamento).toEqual(AGORA);
    });

    it('exige no mínimo 24 horas de antecedência', () => {
      const consulta = agendada(23);

      expect(() => consulta.cancelarPeloPaciente('paciente-1', 'Motivo', AGORA)).toThrow(
        RegraDeNegocioError,
      );
    });

    it('aceita cancelamento com exatamente 24 horas de antecedência', () => {
      const consulta = agendada(24);

      consulta.cancelarPeloPaciente('paciente-1', 'Motivo', AGORA);

      expect(consulta.status).toBe(StatusConsulta.CANCELADA);
    });

    it('exige um motivo', () => {
      expect(() => agendada().cancelarPeloPaciente('paciente-1', '   ', AGORA)).toThrow(
        RegraDeNegocioError,
      );
    });

    it('impede um paciente de cancelar a consulta de outro', () => {
      expect(() => agendada().cancelarPeloPaciente('paciente-2', 'Motivo', AGORA)).toThrow(
        AcessoNegadoError,
      );
    });

    it('só cancela consultas agendadas', () => {
      expect(() => horarioDisponivel().cancelarPeloPaciente('paciente-1', 'Motivo', AGORA)).toThrow(
        RegraDeNegocioError,
      );
    });
  });
});

describe('Consulta — reagendar, remover e editar', () => {
  const canceladaPeloPaciente = ({ horasAteConsulta = 72, id = 'c1' } = {}) => {
    const consulta = horarioDisponivel({ id, data: emHoras(horasAteConsulta) });
    consulta.agendar('paciente-1', AGORA);
    consulta.cancelarPeloPaciente('paciente-1', 'Imprevisto', AGORA);
    return consulta;
  };

  describe('reagendar (desfazer o próprio cancelamento)', () => {
    it('volta a consulta para agendada e limpa os dados do cancelamento', () => {
      const consulta = canceladaPeloPaciente();

      consulta.reagendar('paciente-1', emHoras(1));

      expect(consulta.status).toBe(StatusConsulta.AGENDADA);
      expect(consulta.motivoCancelamento).toBeNull();
      expect(consulta.dataCancelamento).toBeNull();
    });

    it('é permitido até 3 dias depois do cancelamento', () => {
      const consulta = canceladaPeloPaciente({ horasAteConsulta: 24 * 10 });

      expect(consulta.podeSerReagendadaPor('paciente-1', emHoras(72))).toBe(true);
      expect(consulta.podeSerReagendadaPor('paciente-1', emHoras(73))).toBe(false);
      expect(() => consulta.reagendar('paciente-1', emHoras(73))).toThrow(RegraDeNegocioError);
    });

    it('não é permitido se o horário da consulta já passou', () => {
      const consulta = canceladaPeloPaciente({ horasAteConsulta: 30 });

      expect(() => consulta.reagendar('paciente-1', emHoras(31))).toThrow(RegraDeNegocioError);
    });

    it('não é permitido para outro paciente', () => {
      const consulta = canceladaPeloPaciente();

      expect(consulta.podeSerReagendadaPor('paciente-2', AGORA)).toBe(false);
      expect(() => consulta.reagendar('paciente-2', AGORA)).toThrow(AcessoNegadoError);
    });

    it('não é permitido quando quem cancelou foi a clínica', () => {
      const consulta = horarioDisponivel();
      consulta.agendar('paciente-1', AGORA);
      consulta.removerPelaClinica(AGORA);

      expect(consulta.podeSerReagendadaPor('paciente-1', AGORA)).toBe(false);
      expect(() => consulta.reagendar('paciente-1', AGORA)).toThrow(RegraDeNegocioError);
    });
  });

  describe('remover pela clínica', () => {
    it('cancela a consulta com um motivo padrão', () => {
      const consulta = horarioDisponivel();

      consulta.removerPelaClinica(AGORA);

      expect(consulta.status).toBe(StatusConsulta.CANCELADA);
      expect(consulta.motivoCancelamento).toBe('Cancelada pela clínica.');
    });

    it('não remove consulta já cancelada', () => {
      const consulta = canceladaPeloPaciente();

      expect(() => consulta.removerPelaClinica(AGORA)).toThrow(RegraDeNegocioError);
      expect(consulta.motivoCancelamento).toBe('Imprevisto');
    });
  });

  describe('editar', () => {
    it('altera data e descrição de uma consulta ativa', () => {
      const consulta = horarioDisponivel();

      consulta.editar({ data: emHoras(96), descricao: 'Retorno' }, AGORA);

      expect(consulta.data).toEqual(emHoras(96));
      expect(consulta.descricao).toBe('Retorno');
    });

    it('mantém o que não foi informado', () => {
      const consulta = horarioDisponivel();

      consulta.editar({ descricao: 'Retorno' }, AGORA);

      expect(consulta.data).toEqual(emHoras(48));
    });

    it('recusa mover a consulta para o passado', () => {
      expect(() => horarioDisponivel().editar({ data: emHoras(-2) }, AGORA)).toThrow(
        RegraDeNegocioError,
      );
    });

    it('recusa editar consulta cancelada', () => {
      expect(() => canceladaPeloPaciente().editar({ descricao: 'X' }, AGORA)).toThrow(
        RegraDeNegocioError,
      );
    });
  });
});
