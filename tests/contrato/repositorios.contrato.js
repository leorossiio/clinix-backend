import { describe, it, expect } from 'vitest';
import { randomUUID } from 'node:crypto';
import { Usuario } from '../../src/domain/usuario/Usuario.js';
import { Consulta } from '../../src/domain/consulta/Consulta.js';
import { Notificacao } from '../../src/domain/notificacao/Notificacao.js';
import { StatusConsulta } from '../../src/domain/consulta/StatusConsulta.js';
import { StatusUsuario, TipoUsuario } from '../../src/domain/usuario/enums.js';
import { ConflitoError } from '../../src/domain/erros.js';

/**
 * Comportamento que TODA implementação dos repositórios precisa ter.
 *
 * Roda contra o repositório em memória (usado nos testes da API) e contra o
 * Supabase quando há um banco de teste configurado — é isso que garante que o
 * dublê em memória não está "mentindo" sobre o adaptador real.
 *
 * As asserções toleram um banco compartilhado: ids e e-mails são aleatórios e
 * listagens globais são verificadas com "contém", nunca com igualdade exata.
 */
export function verificarContratoDosRepositorios(nome, criarRepositorios) {
  describe(`contrato dos repositórios: ${nome}`, () => {
    const agora = new Date(Date.now() + 60_000);
    const emDias = (dias) => new Date(agora.getTime() + dias * 86_400_000);

    const novoUsuario = (dados = {}) =>
      Usuario.reconstituir({
        id: randomUUID(),
        nome: 'Contrato',
        email: `contrato-${randomUUID()}@clinix.test`,
        senhaHash: 'hash',
        tipo: TipoUsuario.PACIENTE,
        status: StatusUsuario.ATIVO,
        especialidade: null,
        crm: null,
        ...dados,
      });

    async function prepararMedicoEPaciente(repos) {
      const medico = novoUsuario({ tipo: TipoUsuario.MEDICO, especialidade: 2, crm: randomUUID() });
      const paciente = novoUsuario();
      await repos.usuarios.inserir(medico);
      await repos.usuarios.inserir(paciente);
      return { medico, paciente };
    }

    describe('usuários', () => {
      it('recupera por id o que foi inserido', async () => {
        const repos = criarRepositorios();
        const usuario = novoUsuario({ nome: 'Fulano' });

        await repos.usuarios.inserir(usuario);

        expect((await repos.usuarios.buscarPorId(usuario.id)).nome).toBe('Fulano');
      });

      it('retorna null para id inexistente', async () => {
        expect(await criarRepositorios().usuarios.buscarPorId(randomUUID())).toBeNull();
      });

      it('busca por e-mail sem diferenciar maiúsculas', async () => {
        const repos = criarRepositorios();
        const usuario = novoUsuario();
        await repos.usuarios.inserir(usuario);

        expect((await repos.usuarios.buscarPorEmail(usuario.email.toUpperCase()))?.id).toBe(
          usuario.id,
        );
      });

      it('trata "_" e "%" do e-mail como caracteres literais', async () => {
        const repos = criarRepositorios();
        const usuario = novoUsuario({ email: `a_b-${randomUUID()}@clinix.test` });
        await repos.usuarios.inserir(usuario);

        expect(await repos.usuarios.buscarPorEmail(usuario.email.replace('_', 'x'))).toBeNull();
      });

      it('persiste alterações', async () => {
        const repos = criarRepositorios();
        const usuario = novoUsuario();
        await repos.usuarios.inserir(usuario);

        usuario.excluir();
        await repos.usuarios.atualizar(usuario);

        expect((await repos.usuarios.buscarPorId(usuario.id)).estaAtivo).toBe(false);
      });

      it('lista ativos e médicos ativos, ignorando excluídos', async () => {
        const repos = criarRepositorios();
        const { medico, paciente } = await prepararMedicoEPaciente(repos);
        const excluido = novoUsuario({ tipo: TipoUsuario.MEDICO, status: StatusUsuario.EXCLUIDO });
        await repos.usuarios.inserir(excluido);

        const ativos = (await repos.usuarios.listarAtivos()).map((u) => u.id);
        const medicos = (await repos.usuarios.listarMedicosAtivos()).map((u) => u.id);

        expect(ativos).toEqual(expect.arrayContaining([medico.id, paciente.id]));
        expect(ativos).not.toContain(excluido.id);
        expect(medicos).toContain(medico.id);
        expect(medicos).not.toContain(paciente.id);
      });

      it('busca vários de uma vez, ignorando ids inexistentes', async () => {
        const repos = criarRepositorios();
        const { medico, paciente } = await prepararMedicoEPaciente(repos);

        const encontrados = await repos.usuarios.buscarVarios([
          medico.id,
          paciente.id,
          randomUUID(),
        ]);

        expect(encontrados.map((u) => u.id).sort()).toEqual([medico.id, paciente.id].sort());
      });
    });

    describe('consultas', () => {
      const novaConsulta = (idMedico, dias = 2) =>
        Consulta.abrirHorario(
          { id: randomUUID(), idMedico, data: emDias(dias), descricao: 'Contrato' },
          agora,
        );

      it('preserva o instante exato da consulta', async () => {
        const repos = criarRepositorios();
        const { medico } = await prepararMedicoEPaciente(repos);
        const consulta = novaConsulta(medico.id);

        await repos.consultas.inserir(consulta);

        expect((await repos.consultas.buscarPorId(consulta.id)).data).toEqual(consulta.data);
      });

      it('lista por médico e por paciente', async () => {
        const repos = criarRepositorios();
        const { medico, paciente } = await prepararMedicoEPaciente(repos);
        const livre = novaConsulta(medico.id);
        const agendada = novaConsulta(medico.id, 3);
        agendada.agendar(paciente.id, agora);
        await repos.consultas.inserir(livre);
        await repos.consultas.inserir(agendada);

        const doMedico = (await repos.consultas.listarPorMedico(medico.id)).map((c) => c.id);
        const doPaciente = (await repos.consultas.listarPorPaciente(paciente.id)).map((c) => c.id);

        expect(doMedico.sort()).toEqual([livre.id, agendada.id].sort());
        expect(doPaciente).toEqual([agendada.id]);
      });

      it('lista horários disponíveis a partir de um instante', async () => {
        const repos = criarRepositorios();
        const { medico, paciente } = await prepararMedicoEPaciente(repos);
        const proxima = novaConsulta(medico.id, 1);
        const distante = novaConsulta(medico.id, 5);
        const ocupada = novaConsulta(medico.id, 5);
        ocupada.agendar(paciente.id, agora);
        await Promise.all([proxima, distante, ocupada].map((c) => repos.consultas.inserir(c)));

        const ids = (await repos.consultas.listarDisponiveisAPartirDe(emDias(2))).map((c) => c.id);

        expect(ids).toContain(distante.id);
        expect(ids).not.toContain(proxima.id);
        expect(ids).not.toContain(ocupada.id);
      });

      it('persiste o cancelamento com motivo e data', async () => {
        const repos = criarRepositorios();
        const { medico, paciente } = await prepararMedicoEPaciente(repos);
        const consulta = novaConsulta(medico.id, 5);
        consulta.agendar(paciente.id, agora);
        await repos.consultas.inserir(consulta);

        consulta.cancelarPeloPaciente(paciente.id, 'Motivo', agora);
        await repos.consultas.atualizar(consulta, { statusAnterior: StatusConsulta.AGENDADA });

        const salva = await repos.consultas.buscarPorId(consulta.id);
        expect(salva.status).toBe(StatusConsulta.CANCELADA);
        expect(salva.motivoCancelamento).toBe('Motivo');
        expect(Math.abs(salva.dataCancelamento - agora)).toBeLessThan(1000);
      });

      it('recusa gravar se outra pessoa mudou a consulta desde a leitura', async () => {
        const repos = criarRepositorios();
        const { medico, paciente } = await prepararMedicoEPaciente(repos);
        const consulta = novaConsulta(medico.id);
        await repos.consultas.inserir(consulta);
        const copiaDoPrimeiro = await repos.consultas.buscarPorId(consulta.id);
        const copiaDoSegundo = await repos.consultas.buscarPorId(consulta.id);

        copiaDoPrimeiro.agendar(paciente.id, agora);
        await repos.consultas.atualizar(copiaDoPrimeiro, {
          statusAnterior: StatusConsulta.DISPONIVEL,
        });
        copiaDoSegundo.agendar(randomUUID(), agora);

        await expect(
          repos.consultas.atualizar(copiaDoSegundo, { statusAnterior: StatusConsulta.DISPONIVEL }),
        ).rejects.toThrow(ConflitoError);
      });
    });

    describe('notificações', () => {
      it('lista as notificações de uma consulta', async () => {
        const repos = criarRepositorios();
        const { medico } = await prepararMedicoEPaciente(repos);
        const consulta = Consulta.abrirHorario(
          { id: randomUUID(), idMedico: medico.id, data: emDias(2) },
          agora,
        );
        await repos.consultas.inserir(consulta);
        const notificacao = Notificacao.criar({
          id: randomUUID(),
          idConsulta: consulta.id,
          lembrete: 'Jejum de 8h',
          data: agora,
        });

        await repos.notificacoes.inserir(notificacao);

        const lista = await repos.notificacoes.listarPorConsulta(consulta.id);
        expect(lista.map((n) => n.lembrete)).toEqual(['Jejum de 8h']);
      });
    });
  });
}
