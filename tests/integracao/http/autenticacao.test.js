import { describe, it, expect } from 'vitest';
import jwt from 'jsonwebtoken';
import { montarCenario, SENHA_PADRAO } from '../../apoio/cenario.js';
import { Usuario } from '../../../src/domain/usuario/Usuario.js';
import { StatusUsuario, TipoUsuario } from '../../../src/domain/usuario/enums.js';

describe('POST /auth/login', () => {
  it('devolve token e dados do usuário, nunca a senha', async () => {
    const { http, criarPaciente } = montarCenario();
    const paciente = await criarPaciente('Ana');

    const resposta = await http
      .post('/auth/login')
      .send({ email: paciente.email, senha: SENHA_PADRAO });

    expect(resposta.status).toBe(200);
    expect(resposta.body.token).toEqual(expect.any(String));
    expect(resposta.body.usuario).toMatchObject({
      nome: 'Ana',
      tipo_usuario: TipoUsuario.PACIENTE,
    });
    expect(JSON.stringify(resposta.body)).not.toMatch(/senha/i);
  });

  it('aceita o e-mail em qualquer caixa', async () => {
    const { http, criarPaciente } = montarCenario();
    const paciente = await criarPaciente();

    const resposta = await http
      .post('/auth/login')
      .send({ email: paciente.email.toUpperCase(), senha: SENHA_PADRAO });

    expect(resposta.status).toBe(200);
  });

  it('responde igual para senha errada e e-mail inexistente (não revela contas)', async () => {
    const { http, criarPaciente } = montarCenario();
    const paciente = await criarPaciente();

    const senhaErrada = await http
      .post('/auth/login')
      .send({ email: paciente.email, senha: 'errada' });
    const semConta = await http
      .post('/auth/login')
      .send({ email: 'ninguem@x.com', senha: 'errada' });

    expect(senhaErrada.status).toBe(401);
    expect(semConta.status).toBe(401);
    expect(senhaErrada.body).toEqual(semConta.body);
  });

  it('recusa usuário excluído', async () => {
    const { http, criarPaciente, criarAdmin } = montarCenario();
    const paciente = await criarPaciente();
    const admin = await criarAdmin();
    await http.delete(`/usuarios/${paciente.id}`).set('Authorization', admin.auth);

    const resposta = await http
      .post('/auth/login')
      .send({ email: paciente.email, senha: SENHA_PADRAO });

    expect(resposta.status).toBe(401);
  });

  it('protege senhas legadas em texto puro no primeiro login', async () => {
    const { http, repositorios } = montarCenario();
    await repositorios.usuarios.inserir(
      Usuario.reconstituir({
        id: '5f1b7c2e-0000-4000-8000-000000000001',
        nome: 'Legado',
        email: 'legado@clinix.com',
        senhaHash: 'senha-antiga',
        tipo: TipoUsuario.PACIENTE,
        status: StatusUsuario.ATIVO,
        especialidade: null,
        crm: null,
      }),
    );

    const resposta = await http
      .post('/auth/login')
      .send({ email: 'legado@clinix.com', senha: 'senha-antiga' });

    expect(resposta.status).toBe(200);
    const armazenado = await repositorios.usuarios.buscarPorEmail('legado@clinix.com');
    expect(armazenado.senhaHash).not.toBe('senha-antiga');
  });

  it('valida o corpo da requisição', async () => {
    const { http } = montarCenario();

    const resposta = await http.post('/auth/login').send({ email: 'nao-e-email' });

    expect(resposta.status).toBe(400);
    expect(resposta.body.error).toEqual(expect.any(String));
  });

  it('limita tentativas repetidas para dificultar força bruta', async () => {
    const { http } = montarCenario({ LOGIN_RATE_LIMIT: '2' });
    const tentar = () => http.post('/auth/login').send({ email: 'a@a.com', senha: 'x' });

    await tentar();
    await tentar();
    const terceira = await tentar();

    expect(terceira.status).toBe(429);
  });
});

describe('rotas protegidas', () => {
  it('exigem token', async () => {
    const { http } = montarCenario();

    expect((await http.get('/consultas')).status).toBe(401);
  });

  it('recusam token expirado', async () => {
    const { http, criarPaciente, config } = montarCenario();
    const paciente = await criarPaciente();
    const expirado = jwt.sign({ tipo: 0 }, config.jwtSegredo, {
      subject: paciente.id,
      expiresIn: -10,
    });

    const resposta = await http.get('/consultas').set('Authorization', `Bearer ${expirado}`);

    expect(resposta.status).toBe(401);
  });

  it('recusam token de usuário que foi excluído depois do login', async () => {
    const { http, criarPaciente, criarAdmin } = montarCenario();
    const paciente = await criarPaciente();
    const admin = await criarAdmin();
    await http.delete(`/usuarios/${paciente.id}`).set('Authorization', admin.auth);

    const resposta = await http.get('/consultas').set('Authorization', paciente.auth);

    expect(resposta.status).toBe(401);
  });
});

describe('infraestrutura HTTP', () => {
  it('expõe health check para o pipeline e o balanceador', async () => {
    const { http } = montarCenario();

    expect((await http.get('/health')).body).toEqual({ status: 'ok' });
  });

  it('responde 404 em JSON para rotas inexistentes', async () => {
    const { http } = montarCenario();

    const resposta = await http.get('/nao-existe');

    expect(resposta.status).toBe(404);
    expect(resposta.body.error).toEqual(expect.any(String));
  });

  it('responde 400 para JSON malformado', async () => {
    const { http } = montarCenario();

    const resposta = await http
      .post('/auth/login')
      .set('Content-Type', 'application/json')
      .send('{"email":');

    expect(resposta.status).toBe(400);
  });

  it('não expõe mais a rota /env-check', async () => {
    const { http } = montarCenario();

    expect((await http.get('/env-check')).status).toBe(404);
  });
});
