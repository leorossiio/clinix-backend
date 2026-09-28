import { describe, it, expect } from 'vitest';
import { montarCenario, daquiA, SENHA_PADRAO } from '../apoio/cenario.js';
import { Eventos } from '../../src/application/eventos.js';
import { ConflitoError } from '../../src/domain/erros.js';

/** Dublê da porta de eventos: guarda o que foi publicado. */
const coletor = () => {
  const publicados = [];
  return { publicados, publicar: (evento) => publicados.push(evento) };
};

async function cenarioComHorario() {
  const eventos = coletor();
  const cenario = montarCenario({}, { eventos });
  const medico = await cenario.criarMedico('Dra. Ana', 1);
  const paciente = await cenario.criarPaciente('Paulo');
  const { body: horario } = await cenario.http
    .post('/consultas')
    .set('Authorization', medico.auth)
    .send({ data: daquiA(cenario.relogio, 72) });
  return { ...cenario, eventos, medico, paciente, horario };
}

const tipos = (eventos) => eventos.publicados.map((e) => e.tipo);

describe('eventos de domínio (alimentam métricas e logs de negócio)', () => {
  it('abrir horário e agendar publicam eventos com a especialidade', async () => {
    const { http, eventos, paciente, horario } = await cenarioComHorario();

    await http.put(`/consultas/${horario.id_consulta}/agendar`).set('Authorization', paciente.auth);

    expect(eventos.publicados).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ tipo: Eventos.HORARIO_ABERTO, especialidade: 'Pediatria' }),
        expect.objectContaining({
          tipo: Eventos.CONSULTA_AGENDADA,
          idConsulta: horario.id_consulta,
          especialidade: 'Pediatria',
        }),
      ]),
    );
  });

  it('cancelar e reagendar publicam seus eventos', async () => {
    const { http, eventos, paciente, horario } = await cenarioComHorario();
    const url = `/consultas/${horario.id_consulta}`;
    await http.put(`${url}/agendar`).set('Authorization', paciente.auth);
    await http
      .put(`${url}/cancelar`)
      .set('Authorization', paciente.auth)
      .send({ motivo_cancelamento: 'X' });
    await http.put(`${url}/reagendar`).set('Authorization', paciente.auth);

    expect(tipos(eventos)).toEqual(
      expect.arrayContaining([Eventos.CONSULTA_CANCELADA, Eventos.CONSULTA_REAGENDADA]),
    );
  });

  it('uma operação recusada não publica evento de sucesso', async () => {
    const { http, eventos, medico, horario } = await cenarioComHorario();

    await http.put(`/consultas/${horario.id_consulta}/agendar`).set('Authorization', medico.auth);

    expect(tipos(eventos)).not.toContain(Eventos.CONSULTA_AGENDADA);
  });

  it('logins publicam o resultado, sem dados pessoais', async () => {
    const { http, eventos, paciente } = await cenarioComHorario();

    await http.post('/auth/login').send({ email: paciente.email, senha: 'errada' });
    await http.post('/auth/login').send({ email: paciente.email, senha: SENHA_PADRAO });

    const logins = eventos.publicados.filter((e) => e.tipo === Eventos.LOGIN);
    expect(logins.map((e) => e.resultado)).toEqual(expect.arrayContaining(['falha', 'sucesso']));
    expect(JSON.stringify(logins)).not.toContain(paciente.email);
  });

  it('dois pacientes agendando o mesmo horário ao mesmo tempo: um consegue, o outro recebe conflito', async () => {
    const { servicos, repositorios, eventos, horario, criarPaciente } = await cenarioComHorario();
    const outro = await criarPaciente('Outra');
    const primeiro = { id: (await criarPaciente('Um')).id, tipo: 0 };
    const segundo = { id: outro.id, tipo: 0 };

    // Segura as leituras até as duas requisições terem lido a consulta,
    // reproduzindo a corrida que acontece em produção.
    const buscarOriginal = repositorios.consultas.buscarPorId.bind(repositorios.consultas);
    let leituras = 0;
    let liberar;
    const ambasLeram = new Promise((resolve) => (liberar = resolve));
    repositorios.consultas.buscarPorId = async (id) => {
      const consulta = await buscarOriginal(id);
      if (++leituras === 2) liberar();
      await ambasLeram;
      return consulta;
    };

    const resultados = await Promise.allSettled([
      servicos.consultas.agendar(horario.id_consulta, primeiro),
      servicos.consultas.agendar(horario.id_consulta, segundo),
    ]);

    expect(resultados.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
    expect(resultados.find((r) => r.status === 'rejected').reason).toBeInstanceOf(ConflitoError);
    expect(tipos(eventos)).toContain(Eventos.CONFLITO_DE_AGENDAMENTO);
  });
});
