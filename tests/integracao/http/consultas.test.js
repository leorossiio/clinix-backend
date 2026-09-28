import { describe, it, expect } from 'vitest';
import { montarCenario, daquiA } from '../../apoio/cenario.js';
import { StatusConsulta } from '../../../src/domain/consulta/StatusConsulta.js';

/** Cenário comum: um médico com um horário aberto daqui a 3 dias e um paciente. */
async function cenarioComHorario() {
  const cenario = montarCenario();
  const medico = await cenario.criarMedico('Dra. Ana', 1);
  const paciente = await cenario.criarPaciente('Paulo');
  const { body: horario } = await cenario.http
    .post('/consultas')
    .set('Authorization', medico.auth)
    .send({ data: daquiA(cenario.relogio, 72), descricao: 'Rotina' });
  return { ...cenario, medico, paciente, horario };
}

const agendar = (http, id, usuario) =>
  http.put(`/consultas/${id}/agendar`).set('Authorization', usuario.auth);
const cancelar = (http, id, usuario, motivo = 'Imprevisto') =>
  http
    .put(`/consultas/${id}/cancelar`)
    .set('Authorization', usuario.auth)
    .send({ motivo_cancelamento: motivo });
const reagendar = (http, id, usuario) =>
  http.put(`/consultas/${id}/reagendar`).set('Authorization', usuario.auth);
const listar = (http, usuario) => http.get('/consultas').set('Authorization', usuario.auth);

describe('POST /consultas (abrir horário)', () => {
  it('o médico abre um horário na própria agenda', async () => {
    const { horario, medico } = await cenarioComHorario();

    expect(horario).toMatchObject({
      id_medico: medico.id,
      id_paciente: null,
      status: StatusConsulta.DISPONIVEL,
      descricao: 'Rotina',
      medico: { nome: 'Dra. Ana', especialidade: 1 },
    });
  });

  it('o médico não abre horário na agenda de outro médico', async () => {
    const { http, relogio, medico, criarMedico } = await cenarioComHorario();
    const outro = await criarMedico('Dr. Outro');

    const resposta = await http
      .post('/consultas')
      .set('Authorization', medico.auth)
      .send({ id_medico: outro.id, data: daquiA(relogio, 48) });

    expect(resposta.status).toBe(403);
  });

  it('o admin abre horário para um médico escolhido', async () => {
    const { http, relogio, medico, criarAdmin } = await cenarioComHorario();
    const admin = await criarAdmin();

    const resposta = await http
      .post('/consultas')
      .set('Authorization', admin.auth)
      .send({ id_medico: medico.id, data: daquiA(relogio, 48) });

    expect(resposta.status).toBe(201);
    expect(resposta.body.id_medico).toBe(medico.id);
  });

  it('o admin não pode abrir horário para quem não é médico', async () => {
    const { http, relogio, paciente, criarAdmin } = await cenarioComHorario();
    const admin = await criarAdmin();

    const resposta = await http
      .post('/consultas')
      .set('Authorization', admin.auth)
      .send({ id_medico: paciente.id, data: daquiA(relogio, 48) });

    expect(resposta.status).toBe(422);
  });

  it('não abre horário no passado', async () => {
    const { http, relogio, medico } = await cenarioComHorario();

    const resposta = await http
      .post('/consultas')
      .set('Authorization', medico.auth)
      .send({ data: daquiA(relogio, -1) });

    expect(resposta.status).toBe(422);
  });

  it('o médico não pode ter dois horários ativos no mesmo instante (CLINIXSM-45)', async () => {
    const { http, medico, horario } = await cenarioComHorario();

    const resposta = await http
      .post('/consultas')
      .set('Authorization', medico.auth)
      .send({ data: horario.data });

    expect(resposta.status).toBe(422);
  });

  it('um horário removido pela clínica libera o instante para um novo', async () => {
    const { http, medico, horario } = await cenarioComHorario();
    await http.delete(`/consultas/${horario.id_consulta}`).set('Authorization', medico.auth);

    const resposta = await http
      .post('/consultas')
      .set('Authorization', medico.auth)
      .send({ data: horario.data });

    expect(resposta.status).toBe(201);
  });

  it('paciente não abre horários', async () => {
    const { http, relogio, paciente } = await cenarioComHorario();

    const resposta = await http
      .post('/consultas')
      .set('Authorization', paciente.auth)
      .send({ data: daquiA(relogio, 48) });

    expect(resposta.status).toBe(403);
  });
});

describe('GET /consultas', () => {
  it('o paciente vê horários livres e as próprias consultas, mas não as de outros', async () => {
    const { http, horario, paciente, criarPaciente, medico, relogio } = await cenarioComHorario();
    const outroPaciente = await criarPaciente('Outro');
    const { body: doOutro } = await http
      .post('/consultas')
      .set('Authorization', medico.auth)
      .send({ data: daquiA(relogio, 96) });
    await agendar(http, doOutro.id_consulta, outroPaciente);
    await agendar(http, horario.id_consulta, paciente);
    const { body: livre } = await http
      .post('/consultas')
      .set('Authorization', medico.auth)
      .send({ data: daquiA(relogio, 120) });

    const { body } = await listar(http, paciente);

    expect(body.map((c) => c.id_consulta).sort()).toEqual(
      [horario.id_consulta, livre.id_consulta].sort(),
    );
  });

  it('o paciente não vê horários livres que já passaram', async () => {
    const { http, horario, paciente, relogio } = await cenarioComHorario();
    relogio.avancarHoras(100);

    const { body } = await listar(http, paciente);

    expect(body.map((c) => c.id_consulta)).not.toContain(horario.id_consulta);
  });

  it('o médico vê apenas a própria agenda', async () => {
    const { http, horario, medico, criarMedico, relogio } = await cenarioComHorario();
    const outro = await criarMedico('Dr. Outro');
    await http
      .post('/consultas')
      .set('Authorization', outro.auth)
      .send({ data: daquiA(relogio, 10) });

    const { body } = await listar(http, medico);

    expect(body.map((c) => c.id_consulta)).toEqual([horario.id_consulta]);
  });

  it('o admin vê todas as consultas, das mais recentes para as mais antigas', async () => {
    const { http, horario, criarMedico, criarAdmin, relogio } = await cenarioComHorario();
    const outro = await criarMedico('Dr. Outro');
    const { body: posterior } = await http
      .post('/consultas')
      .set('Authorization', outro.auth)
      .send({ data: daquiA(relogio, 200) });
    const admin = await criarAdmin();

    const { body } = await listar(http, admin);

    expect(body.map((c) => c.id_consulta)).toEqual([posterior.id_consulta, horario.id_consulta]);
  });

  it('traz o nome de quem agendou', async () => {
    const { http, horario, paciente, medico } = await cenarioComHorario();
    await agendar(http, horario.id_consulta, paciente);

    const { body } = await listar(http, medico);

    expect(body[0].paciente).toEqual({ id_usuario: paciente.id, nome: 'Paulo' });
  });
});

describe('GET /consultas/:id', () => {
  it('um paciente vê um horário livre', async () => {
    const { http, horario, paciente } = await cenarioComHorario();

    const resposta = await http
      .get(`/consultas/${horario.id_consulta}`)
      .set('Authorization', paciente.auth);

    expect(resposta.status).toBe(200);
  });

  it('um paciente não vê a consulta agendada por outro', async () => {
    const { http, horario, paciente, criarPaciente } = await cenarioComHorario();
    await agendar(http, horario.id_consulta, paciente);
    const intruso = await criarPaciente();

    const resposta = await http
      .get(`/consultas/${horario.id_consulta}`)
      .set('Authorization', intruso.auth);

    expect(resposta.status).toBe(404);
  });

  it('responde 404 para consulta inexistente', async () => {
    const { http, medico } = await cenarioComHorario();

    const resposta = await http
      .get('/consultas/5f1b7c2e-0000-4000-8000-000000000999')
      .set('Authorization', medico.auth);

    expect(resposta.status).toBe(404);
  });
});

describe('PUT /consultas/:id/agendar', () => {
  it('o paciente agenda um horário livre para si mesmo', async () => {
    const { http, horario, paciente } = await cenarioComHorario();

    const resposta = await agendar(http, horario.id_consulta, paciente);

    expect(resposta.status).toBe(200);
    expect(resposta.body).toMatchObject({
      status: StatusConsulta.AGENDADA,
      id_paciente: paciente.id,
    });
  });

  it('um segundo paciente não consegue tomar o horário já agendado', async () => {
    const { http, horario, paciente, criarPaciente } = await cenarioComHorario();
    await agendar(http, horario.id_consulta, paciente);
    const outro = await criarPaciente();

    const resposta = await agendar(http, horario.id_consulta, outro);

    expect(resposta.status).toBe(422);
  });

  it('médicos não agendam como se fossem pacientes', async () => {
    const { http, horario, medico } = await cenarioComHorario();

    expect((await agendar(http, horario.id_consulta, medico)).status).toBe(403);
  });
});

describe('PUT /consultas/:id/cancelar', () => {
  it('o paciente cancela a própria consulta informando o motivo', async () => {
    const { http, horario, paciente } = await cenarioComHorario();
    await agendar(http, horario.id_consulta, paciente);

    const resposta = await cancelar(http, horario.id_consulta, paciente, 'Viagem');

    expect(resposta.status).toBe(200);
    expect(resposta.body).toMatchObject({
      status: StatusConsulta.CANCELADA,
      motivo_cancelamento: 'Viagem',
    });
  });

  it('não permite cancelar com menos de 24 horas de antecedência', async () => {
    const { http, horario, paciente, relogio } = await cenarioComHorario();
    await agendar(http, horario.id_consulta, paciente);
    relogio.avancarHoras(50);

    expect((await cancelar(http, horario.id_consulta, paciente)).status).toBe(422);
  });

  it('exige o motivo', async () => {
    const { http, horario, paciente } = await cenarioComHorario();
    await agendar(http, horario.id_consulta, paciente);

    expect((await cancelar(http, horario.id_consulta, paciente, '')).status).toBe(400);
  });

  it('um paciente não cancela a consulta de outro', async () => {
    const { http, horario, paciente, criarPaciente } = await cenarioComHorario();
    await agendar(http, horario.id_consulta, paciente);
    const outro = await criarPaciente();

    expect((await cancelar(http, horario.id_consulta, outro)).status).toBe(403);
  });
});

describe('PUT /consultas/:id/reagendar', () => {
  async function cenarioCancelado() {
    const cenario = await cenarioComHorario();
    await agendar(cenario.http, cenario.horario.id_consulta, cenario.paciente);
    await cancelar(cenario.http, cenario.horario.id_consulta, cenario.paciente);
    return cenario;
  }

  it('a listagem indica qual consulta o paciente ainda pode reagendar', async () => {
    const { http, horario, paciente } = await cenarioCancelado();

    const { body } = await listar(http, paciente);

    expect(body.find((c) => c.id_consulta === horario.id_consulta).reagendavel).toBe(true);
  });

  it('o paciente desfaz o próprio cancelamento', async () => {
    const { http, horario, paciente } = await cenarioCancelado();

    const resposta = await reagendar(http, horario.id_consulta, paciente);

    expect(resposta.status).toBe(200);
    expect(resposta.body).toMatchObject({
      status: StatusConsulta.AGENDADA,
      motivo_cancelamento: null,
    });
  });

  it('não é possível depois do prazo de 3 dias', async () => {
    const cenario = montarCenario();
    const medico = await cenario.criarMedico();
    const paciente = await cenario.criarPaciente();
    const { body: horario } = await cenario.http
      .post('/consultas')
      .set('Authorization', medico.auth)
      .send({ data: daquiA(cenario.relogio, 24 * 10) });
    await agendar(cenario.http, horario.id_consulta, paciente);
    await cancelar(cenario.http, horario.id_consulta, paciente);
    cenario.relogio.avancarHoras(73);

    expect((await reagendar(cenario.http, horario.id_consulta, paciente)).status).toBe(422);
  });

  it('só o cancelamento mais recente pode ser desfeito', async () => {
    const { http, horario, paciente, medico, relogio } = await cenarioCancelado();
    const { body: segundo } = await http
      .post('/consultas')
      .set('Authorization', medico.auth)
      .send({ data: daquiA(relogio, 96) });
    await agendar(http, segundo.id_consulta, paciente);
    relogio.avancarHoras(1);
    await cancelar(http, segundo.id_consulta, paciente);

    expect((await reagendar(http, horario.id_consulta, paciente)).status).toBe(422);
    expect((await reagendar(http, segundo.id_consulta, paciente)).status).toBe(200);
  });
});

describe('DELETE /consultas/:id (remoção pela clínica)', () => {
  it('o médico remove um horário da própria agenda', async () => {
    const { http, horario, medico } = await cenarioComHorario();

    const resposta = await http
      .delete(`/consultas/${horario.id_consulta}`)
      .set('Authorization', medico.auth);

    expect(resposta.status).toBe(200);
    expect(resposta.body.status).toBe(StatusConsulta.CANCELADA);
  });

  it('o paciente não pode desfazer uma remoção feita pela clínica', async () => {
    const { http, horario, medico, paciente } = await cenarioComHorario();
    await agendar(http, horario.id_consulta, paciente);
    await http.delete(`/consultas/${horario.id_consulta}`).set('Authorization', medico.auth);

    const { body } = await listar(http, paciente);

    expect(body.find((c) => c.id_consulta === horario.id_consulta).reagendavel).toBe(false);
    expect((await reagendar(http, horario.id_consulta, paciente)).status).toBe(422);
  });

  it('um médico não remove horários de outro médico', async () => {
    const { http, horario, criarMedico } = await cenarioComHorario();
    const outro = await criarMedico('Dr. Outro');

    expect(
      (await http.delete(`/consultas/${horario.id_consulta}`).set('Authorization', outro.auth))
        .status,
    ).toBe(403);
  });
});

describe('PUT /consultas/:id (edição)', () => {
  it('o médico altera data e descrição', async () => {
    const { http, horario, medico, relogio } = await cenarioComHorario();
    const novaData = daquiA(relogio, 100);

    const resposta = await http
      .put(`/consultas/${horario.id_consulta}`)
      .set('Authorization', medico.auth)
      .send({ data: novaData, descricao: 'Retorno' });

    expect(resposta.status).toBe(200);
    expect(resposta.body).toMatchObject({ data: novaData, descricao: 'Retorno' });
  });

  it('não move a consulta para um instante já ocupado na agenda do médico', async () => {
    const { http, horario, medico, relogio } = await cenarioComHorario();
    const { body: outro } = await http
      .post('/consultas')
      .set('Authorization', medico.auth)
      .send({ data: daquiA(relogio, 100) });

    const resposta = await http
      .put(`/consultas/${outro.id_consulta}`)
      .set('Authorization', medico.auth)
      .send({ data: horario.data });

    expect(resposta.status).toBe(422);
  });

  it('pode salvar a consulta mantendo o mesmo horário', async () => {
    const { http, horario, medico } = await cenarioComHorario();

    const resposta = await http
      .put(`/consultas/${horario.id_consulta}`)
      .set('Authorization', medico.auth)
      .send({ data: horario.data, descricao: 'Nova descrição' });

    expect(resposta.status).toBe(200);
  });

  it('recusa campos que não podem ser editados', async () => {
    const { http, horario, medico } = await cenarioComHorario();

    const resposta = await http
      .put(`/consultas/${horario.id_consulta}`)
      .set('Authorization', medico.auth)
      .send({ status: StatusConsulta.CONCLUIDA });

    expect(resposta.status).toBe(400);
  });

  it('um médico não edita a agenda de outro', async () => {
    const { http, horario, criarMedico } = await cenarioComHorario();
    const outro = await criarMedico('Dr. Outro');

    const resposta = await http
      .put(`/consultas/${horario.id_consulta}`)
      .set('Authorization', outro.auth)
      .send({ descricao: 'X' });

    expect(resposta.status).toBe(403);
  });
});
