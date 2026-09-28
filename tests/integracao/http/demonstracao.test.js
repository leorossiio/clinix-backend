import { describe, it, expect } from 'vitest';
import { carregarConfiguracao } from '../../../src/config.js';
import { montarDependencias } from '../../../src/container.js';
import { criarApp } from '../../../src/interfaces/http/app.js';
import { semearDadosDeDemonstracao } from '../../../src/infrastructure/memoria/dadosDeDemonstracao.js';
import supertest from 'supertest';

describe('modo demonstração (BANCO=memoria)', () => {
  it('o paciente de demonstração entra e encontra horários para agendar', async () => {
    const config = carregarConfiguracao({
      BANCO: 'memoria',
      JWT_SECRET: 'z'.repeat(32),
      BCRYPT_COST: '4',
    });
    const dependencias = montarDependencias(config);
    await semearDadosDeDemonstracao(dependencias);
    const http = supertest(criarApp(dependencias, config));

    const { body: sessao } = await http
      .post('/auth/login')
      .send({ email: 'paciente@clinix.dev', senha: 'clinix123' });
    const { body: consultas } = await http
      .get('/consultas')
      .set('Authorization', `Bearer ${sessao.token}`);

    expect(consultas.filter((c) => c.status === 0).length).toBeGreaterThan(0);
    expect(consultas.some((c) => c.paciente?.nome === 'Paciente Demonstração')).toBe(true);
  });
});
