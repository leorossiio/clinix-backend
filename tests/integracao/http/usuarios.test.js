import { describe, it, expect } from 'vitest';
import { montarCenario, SENHA_PADRAO } from '../../apoio/cenario.js';
import { StatusUsuario, TipoUsuario } from '../../../src/domain/usuario/enums.js';

const novoCadastro = (dados = {}) => ({
  nome: 'Carla',
  email: 'carla@clinix.com',
  senha: 'segura123',
  ...dados,
});

describe('POST /usuarios (auto-cadastro)', () => {
  it('cadastra um paciente e não devolve a senha', async () => {
    const { http } = montarCenario();

    const resposta = await http.post('/usuarios').send(novoCadastro());

    expect(resposta.status).toBe(201);
    expect(resposta.body).toMatchObject({
      nome: 'Carla',
      email: 'carla@clinix.com',
      tipo_usuario: TipoUsuario.PACIENTE,
      status: StatusUsuario.ATIVO,
    });
    expect(resposta.body).not.toHaveProperty('senha');
  });

  it('o novo paciente consegue entrar com a senha cadastrada', async () => {
    const { http } = montarCenario();
    await http.post('/usuarios').send(novoCadastro());

    const login = await http
      .post('/auth/login')
      .send({ email: 'carla@clinix.com', senha: 'segura123' });

    expect(login.status).toBe(200);
  });

  it('não permite escolher o próprio perfil (ninguém se cadastra como admin)', async () => {
    const { http } = montarCenario();

    const resposta = await http
      .post('/usuarios')
      .send(novoCadastro({ tipo_usuario: TipoUsuario.ADMIN }));

    expect(resposta.status).toBe(400);
  });

  it('recusa e-mail já usado por um usuário ativo', async () => {
    const { http } = montarCenario();
    await http.post('/usuarios').send(novoCadastro());

    const resposta = await http.post('/usuarios').send(novoCadastro({ nome: 'Outra' }));

    expect(resposta.status).toBe(409);
  });

  it('reativa a conta de quem foi excluído e se cadastra de novo', async () => {
    const { http, criarAdmin } = montarCenario();
    const admin = await criarAdmin();
    const { body: criado } = await http.post('/usuarios').send(novoCadastro());
    await http.delete(`/usuarios/${criado.id_usuario}`).set('Authorization', admin.auth);

    const resposta = await http.post('/usuarios').send(novoCadastro({ senha: 'nova-senha' }));

    expect(resposta.status).toBe(200);
    expect(resposta.body.id_usuario).toBe(criado.id_usuario);
    const login = await http
      .post('/auth/login')
      .send({ email: 'carla@clinix.com', senha: 'nova-senha' });
    expect(login.status).toBe(200);
  });

  it.each([
    ['e-mail inválido', { email: 'invalido' }],
    ['senha curta', { senha: '123' }],
    ['nome vazio', { nome: '' }],
  ])('recusa %s', async (_caso, dados) => {
    const { http } = montarCenario();

    expect((await http.post('/usuarios').send(novoCadastro(dados))).status).toBe(400);
  });
});

describe('GET /usuarios', () => {
  it('o administrador lista os usuários ativos, sem senhas', async () => {
    const { http, criarAdmin, criarPaciente } = montarCenario();
    const admin = await criarAdmin();
    await criarPaciente('Paula');

    const resposta = await http.get('/usuarios').set('Authorization', admin.auth);

    expect(resposta.status).toBe(200);
    expect(resposta.body.map((u) => u.nome)).toEqual(expect.arrayContaining(['Paula', 'Admin']));
    expect(JSON.stringify(resposta.body)).not.toMatch(/senha/i);
  });

  it.each(['criarPaciente', 'criarMedico'])(
    'é proibido para quem não é admin (%s)',
    async (criar) => {
      const cenario = montarCenario();
      const usuario = await cenario[criar]();

      expect((await cenario.http.get('/usuarios').set('Authorization', usuario.auth)).status).toBe(
        403,
      );
    },
  );
});

describe('GET /usuarios/medicos', () => {
  it('lista apenas médicos ativos para usuários autenticados', async () => {
    const { http, criarMedico, criarPaciente } = montarCenario();
    await criarMedico('Dr. House', 4);
    const paciente = await criarPaciente();

    const resposta = await http.get('/usuarios/medicos').set('Authorization', paciente.auth);

    expect(resposta.status).toBe(200);
    expect(resposta.body).toEqual([
      expect.objectContaining({ nome: 'Dr. House', especialidade: 4 }),
    ]);
  });
});

describe('GET /usuarios/:id', () => {
  it('o usuário consulta os próprios dados', async () => {
    const { http, criarPaciente } = montarCenario();
    const paciente = await criarPaciente('Pedro');

    const resposta = await http.get(`/usuarios/${paciente.id}`).set('Authorization', paciente.auth);

    expect(resposta.body.nome).toBe('Pedro');
  });

  it('um paciente não vê os dados de outro', async () => {
    const { http, criarPaciente } = montarCenario();
    const pedro = await criarPaciente('Pedro');
    const joana = await criarPaciente('Joana');

    expect((await http.get(`/usuarios/${joana.id}`).set('Authorization', pedro.auth)).status).toBe(
      403,
    );
  });

  it('responde 400 para id malformado e 404 para id inexistente', async () => {
    const { http, criarAdmin } = montarCenario();
    const admin = await criarAdmin();

    expect((await http.get('/usuarios/123').set('Authorization', admin.auth)).status).toBe(400);
    expect(
      (
        await http
          .get('/usuarios/5f1b7c2e-0000-4000-8000-000000000999')
          .set('Authorization', admin.auth)
      ).status,
    ).toBe(404);
  });
});

describe('PUT /usuarios/:id', () => {
  it('o usuário altera o próprio nome', async () => {
    const { http, criarPaciente } = montarCenario();
    const paciente = await criarPaciente('Pedro');

    const resposta = await http
      .put(`/usuarios/${paciente.id}`)
      .set('Authorization', paciente.auth)
      .send({ nome: 'Pedro Henrique' });

    expect(resposta.status).toBe(200);
    expect(resposta.body.nome).toBe('Pedro Henrique');
  });

  it('a nova senha passa a valer no login', async () => {
    const { http, criarPaciente } = montarCenario();
    const paciente = await criarPaciente();

    await http
      .put(`/usuarios/${paciente.id}`)
      .set('Authorization', paciente.auth)
      .send({ senha: 'trocada1' });

    const antiga = await http
      .post('/auth/login')
      .send({ email: paciente.email, senha: SENHA_PADRAO });
    const nova = await http.post('/auth/login').send({ email: paciente.email, senha: 'trocada1' });
    expect(antiga.status).toBe(401);
    expect(nova.status).toBe(200);
  });

  it('ninguém altera os dados de outra pessoa sem ser admin', async () => {
    const { http, criarPaciente } = montarCenario();
    const pedro = await criarPaciente();
    const joana = await criarPaciente();

    const resposta = await http
      .put(`/usuarios/${joana.id}`)
      .set('Authorization', pedro.auth)
      .send({ senha: 'invadida' });

    expect(resposta.status).toBe(403);
  });

  it('o admin altera dados de qualquer usuário', async () => {
    const { http, criarPaciente, criarAdmin } = montarCenario();
    const paciente = await criarPaciente();
    const admin = await criarAdmin();

    const resposta = await http
      .put(`/usuarios/${paciente.id}`)
      .set('Authorization', admin.auth)
      .send({ nome: 'Novo' });

    expect(resposta.status).toBe(200);
  });

  it('recusa e-mail que já pertence a outra pessoa', async () => {
    const { http, criarPaciente } = montarCenario();
    const pedro = await criarPaciente();
    const joana = await criarPaciente();

    const resposta = await http
      .put(`/usuarios/${pedro.id}`)
      .set('Authorization', pedro.auth)
      .send({ email: joana.email });

    expect(resposta.status).toBe(409);
  });

  it('exige ao menos um campo', async () => {
    const { http, criarPaciente } = montarCenario();
    const paciente = await criarPaciente();

    expect(
      (await http.put(`/usuarios/${paciente.id}`).set('Authorization', paciente.auth).send({}))
        .status,
    ).toBe(400);
  });
});

describe('DELETE /usuarios/:id', () => {
  it('o admin exclui um usuário, que some da listagem', async () => {
    const { http, criarPaciente, criarAdmin } = montarCenario();
    const paciente = await criarPaciente('Some');
    const admin = await criarAdmin();

    const resposta = await http.delete(`/usuarios/${paciente.id}`).set('Authorization', admin.auth);

    expect(resposta.status).toBe(204);
    const lista = await http.get('/usuarios').set('Authorization', admin.auth);
    expect(lista.body.map((u) => u.nome)).not.toContain('Some');
  });

  it('o admin não pode excluir a própria conta', async () => {
    const { http, criarAdmin } = montarCenario();
    const admin = await criarAdmin();

    expect(
      (await http.delete(`/usuarios/${admin.id}`).set('Authorization', admin.auth)).status,
    ).toBe(422);
  });

  it('é proibido para quem não é admin', async () => {
    const { http, criarPaciente } = montarCenario();
    const pedro = await criarPaciente();
    const joana = await criarPaciente();

    expect(
      (await http.delete(`/usuarios/${joana.id}`).set('Authorization', pedro.auth)).status,
    ).toBe(403);
  });
});
