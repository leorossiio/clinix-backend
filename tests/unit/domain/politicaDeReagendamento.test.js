import { describe, it, expect } from 'vitest';
import { Consulta } from '../../../src/domain/consulta/Consulta.js';
import { consultaReagendavel } from '../../../src/domain/consulta/politicaDeReagendamento.js';
import { AGORA, emHoras } from '../../apoio/tempo.js';

/** Cria uma consulta cancelada pelo paciente no instante `canceladaEm`. */
const canceladaEm = (id, canceladaEm) => {
  const consulta = Consulta.abrirHorario({ id, idMedico: 'm', data: emHoras(24 * 30) }, AGORA);
  consulta.agendar('paciente-1', AGORA);
  consulta.cancelarPeloPaciente('paciente-1', 'Motivo', canceladaEm);
  return consulta;
};

describe('política de reagendamento', () => {
  it('só o cancelamento mais recente do paciente pode ser desfeito', () => {
    const antiga = canceladaEm('antiga', emHoras(1));
    const recente = canceladaEm('recente', emHoras(2));

    expect(consultaReagendavel([antiga, recente], 'paciente-1', emHoras(3))?.id).toBe('recente');
  });

  it('não indica nenhuma consulta quando o mais recente já expirou', () => {
    const consulta = canceladaEm('c1', emHoras(1));

    expect(consultaReagendavel([consulta], 'paciente-1', emHoras(1 + 72 + 1))).toBeNull();
  });

  it('ignora consultas que não estão canceladas', () => {
    const agendada = Consulta.abrirHorario({ id: 'a', idMedico: 'm', data: emHoras(48) }, AGORA);
    agendada.agendar('paciente-1', AGORA);

    expect(consultaReagendavel([agendada], 'paciente-1', AGORA)).toBeNull();
  });
});
