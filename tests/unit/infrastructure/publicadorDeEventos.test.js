import { describe, it, expect } from 'vitest';
import { criarPublicadorDeEventos } from '../../../src/infrastructure/observabilidade/publicadorDeEventos.js';
import { Eventos } from '../../../src/application/eventos.js';

/** Dublês das APIs do OpenTelemetry e do logger: são a fronteira com o mundo externo. */
function montar() {
  const contagens = [];
  const logs = [];
  const meter = {
    createCounter: (nome) => ({
      add: (valor, atributos) => contagens.push({ nome, valor, atributos }),
    }),
  };
  const logger = { info: (dados, mensagem) => logs.push({ dados, mensagem }) };
  return { publicador: criarPublicadorDeEventos({ logger, meter }), contagens, logs };
}

describe('publicador de eventos (métricas e logs de negócio)', () => {
  it('conta cada evento no contador correspondente, com seus atributos', () => {
    const { publicador, contagens } = montar();

    publicador.publicar({
      tipo: Eventos.CONSULTA_AGENDADA,
      idConsulta: 'c1',
      especialidade: 'Pediatria',
    });

    expect(contagens).toEqual([
      { nome: 'clinix.consultas.agendadas', valor: 1, atributos: { especialidade: 'Pediatria' } },
    ]);
  });

  it('nunca usa o id da consulta como atributo de métrica (cardinalidade)', () => {
    const { publicador, contagens } = montar();

    publicador.publicar({ tipo: Eventos.CONFLITO_DE_AGENDAMENTO, idConsulta: 'c1' });

    expect(contagens[0].atributos).not.toHaveProperty('idConsulta');
  });

  it('registra o evento em log estruturado, com o id para investigação', () => {
    const { publicador, logs } = montar();

    publicador.publicar({
      tipo: Eventos.CONSULTA_CANCELADA,
      idConsulta: 'c1',
      especialidade: 'Ortopedia',
    });

    expect(logs[0].dados).toMatchObject({ evento: 'consulta.cancelada', idConsulta: 'c1' });
  });

  it('ignora eventos desconhecidos nas métricas, mas ainda registra em log', () => {
    const { publicador, contagens, logs } = montar();

    publicador.publicar({ tipo: 'algo.novo' });

    expect(contagens).toEqual([]);
    expect(logs).toHaveLength(1);
  });
});
