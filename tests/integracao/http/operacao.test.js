import { describe, it, expect } from 'vitest';
import { montarCenario } from '../../apoio/cenario.js';

describe('operação', () => {
  it('/ready confirma que a API alcança o banco', async () => {
    const { http } = montarCenario();

    const resposta = await http.get('/ready');

    expect(resposta.status).toBe(200);
    expect(resposta.body).toEqual({ status: 'pronto' });
  });

  it('toda resposta traz um x-request-id para correlacionar logs e traces', async () => {
    const { http } = montarCenario();

    const resposta = await http.get('/health');

    expect(resposta.headers['x-request-id']).toMatch(/^[\w-]{8,}$/);
  });

  it('reaproveita o x-request-id recebido (ex.: gerado pelo nginx)', async () => {
    const { http } = montarCenario();

    const resposta = await http.get('/health').set('x-request-id', 'req-abc-123');

    expect(resposta.headers['x-request-id']).toBe('req-abc-123');
  });

  it('ignora x-request-id malformado', async () => {
    const { http } = montarCenario();

    const resposta = await http.get('/health').set('x-request-id', 'x'.repeat(200));

    expect(resposta.headers['x-request-id']).not.toBe('x'.repeat(200));
  });
});
