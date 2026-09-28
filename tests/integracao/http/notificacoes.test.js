import { describe, it, expect } from 'vitest';
import { montarCenario, daquiA } from '../../apoio/cenario.js';

async function cenarioComConsulta() {
  const cenario = montarCenario();
  const medico = await cenario.criarMedico();
  const { body: consulta } = await cenario.http
    .post('/consultas')
    .set('Authorization', medico.auth)
    .send({ data: daquiA(cenario.relogio, 48) });
  return { ...cenario, medico, consulta };
}

describe('notificações (lembretes de consulta)', () => {
  it('o médico registra um lembrete e o encontra na listagem da consulta', async () => {
    const { http, medico, consulta } = await cenarioComConsulta();

    const criada = await http
      .post('/notificacoes')
      .set('Authorization', medico.auth)
      .send({ id_consulta: consulta.id_consulta, lembrete: 'Levar exames' });
    const lista = await http
      .get(`/notificacoes?id_consulta=${consulta.id_consulta}`)
      .set('Authorization', medico.auth);

    expect(criada.status).toBe(201);
    expect(lista.body).toEqual([expect.objectContaining({ lembrete: 'Levar exames' })]);
  });

  it('um médico não registra lembretes na agenda de outro', async () => {
    const { http, consulta, criarMedico } = await cenarioComConsulta();
    const outro = await criarMedico('Dr. Outro');

    const resposta = await http
      .post('/notificacoes')
      .set('Authorization', outro.auth)
      .send({ id_consulta: consulta.id_consulta, lembrete: 'X' });

    expect(resposta.status).toBe(403);
  });

  it('pacientes não acessam lembretes', async () => {
    const { http, consulta, criarPaciente } = await cenarioComConsulta();
    const paciente = await criarPaciente();

    const resposta = await http
      .get(`/notificacoes?id_consulta=${consulta.id_consulta}`)
      .set('Authorization', paciente.auth);

    expect(resposta.status).toBe(403);
  });

  it('responde 404 para consulta inexistente', async () => {
    const { http, medico } = await cenarioComConsulta();

    const resposta = await http
      .post('/notificacoes')
      .set('Authorization', medico.auth)
      .send({ id_consulta: '5f1b7c2e-0000-4000-8000-000000000999', lembrete: 'X' });

    expect(resposta.status).toBe(404);
  });
});
