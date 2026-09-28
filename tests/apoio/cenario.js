import supertest from 'supertest';
import { randomUUID } from 'node:crypto';
import { carregarConfiguracao } from '../../src/config.js';
import { montarDependencias } from '../../src/container.js';
import { criarApp } from '../../src/interfaces/http/app.js';
import { Usuario } from '../../src/domain/usuario/Usuario.js';
import { StatusUsuario, TipoUsuario } from '../../src/domain/usuario/enums.js';
import { relogioFixo } from './tempo.js';

export const SENHA_PADRAO = 'senha123';

/**
 * Monta a aplicação completa (HTTP + casos de uso + domínio) sobre
 * repositórios em memória e um relógio controlável.
 *
 * Médicos e administradores não têm cadastro público, então são criados
 * direto no repositório — é só preparação; as verificações dos testes
 * passam sempre pela API.
 */
export function montarCenario(variaveis = {}, { eventos } = {}) {
  const config = carregarConfiguracao({
    BANCO: 'memoria',
    JWT_SECRET: 'segredo-de-teste-com-mais-de-32-caracteres',
    BCRYPT_COST: '4',
    LOGIN_RATE_LIMIT: '1000',
    LOG_LEVEL: 'silent',
    ...variaveis,
  });
  const relogio = relogioFixo();
  const dependencias = montarDependencias(config, { relogio, eventos });
  const http = supertest(criarApp(dependencias, config));
  const { repositorios, hasher } = dependencias;

  async function criarUsuario({ tipo, nome, email, especialidade = null, crm = null }) {
    const usuario = Usuario.reconstituir({
      id: randomUUID(),
      nome,
      email: email ?? `${randomUUID()}@clinix.test`,
      senhaHash: await hasher.gerarHash(SENHA_PADRAO),
      tipo,
      status: StatusUsuario.ATIVO,
      especialidade,
      crm,
    });
    await repositorios.usuarios.inserir(usuario);
    const { body } = await http
      .post('/auth/login')
      .send({ email: usuario.email, senha: SENHA_PADRAO });
    return {
      id: usuario.id,
      email: usuario.email,
      token: body.token,
      auth: `Bearer ${body.token}`,
    };
  }

  return {
    http,
    relogio,
    repositorios,
    servicos: dependencias.servicos,
    config,
    criarPaciente: (nome = 'Paciente') => criarUsuario({ tipo: TipoUsuario.PACIENTE, nome }),
    criarMedico: (nome = 'Dra. Médica', especialidade = 0) =>
      criarUsuario({ tipo: TipoUsuario.MEDICO, nome, especialidade, crm: '12345' }),
    criarAdmin: (nome = 'Admin') => criarUsuario({ tipo: TipoUsuario.ADMIN, nome }),
  };
}

/** ISO do instante `horas` à frente do relógio do cenário. */
export const daquiA = (relogio, horas) =>
  new Date(relogio.agora().getTime() + horas * 3_600_000).toISOString();
