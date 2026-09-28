import { randomUUID } from 'node:crypto';
import { Consulta } from '../../domain/consulta/Consulta.js';
import { Usuario } from '../../domain/usuario/Usuario.js';
import { StatusUsuario, TipoUsuario } from '../../domain/usuario/enums.js';

const SENHA_DEMONSTRACAO = 'clinix123';

/**
 * Popula o banco com um cenário navegável: um usuário de cada perfil e alguns
 * horários. Idempotente: se o administrador de demonstração já existe, não faz nada.
 *
 * @returns {Promise<boolean>} se os dados foram criados agora
 */
export async function semearDadosDeDemonstracao({ repositorios, hasher, relogio }) {
  if (await repositorios.usuarios.buscarPorEmail('admin@clinix.dev')) return false;
  const senhaHash = await hasher.gerarHash(SENHA_DEMONSTRACAO);
  const usuario = (nome, email, tipo, extras = {}) =>
    Usuario.reconstituir({
      id: randomUUID(),
      nome,
      email,
      senhaHash,
      tipo,
      status: StatusUsuario.ATIVO,
      especialidade: null,
      crm: null,
      ...extras,
    });

  const admin = usuario('Administração Clinix', 'admin@clinix.dev', TipoUsuario.ADMIN);
  const cardiologista = usuario('Dra. Helena Prado', 'medica@clinix.dev', TipoUsuario.MEDICO, {
    especialidade: 0,
    crm: '123456',
  });
  const pediatra = usuario('Dr. Rafael Lima', 'medico@clinix.dev', TipoUsuario.MEDICO, {
    especialidade: 1,
    crm: '654321',
  });
  const paciente = usuario('Paciente Demonstração', 'paciente@clinix.dev', TipoUsuario.PACIENTE);
  for (const u of [admin, cardiologista, pediatra, paciente])
    await repositorios.usuarios.inserir(u);

  const agora = relogio.agora();
  const emDias = (dias, hora) => {
    const data = new Date(agora);
    data.setUTCDate(data.getUTCDate() + dias);
    data.setUTCHours(hora, 0, 0, 0);
    return data;
  };
  const horarios = [
    [cardiologista, emDias(2, 13), 'Check-up cardiológico'],
    [cardiologista, emDias(4, 17), 'Retorno'],
    [pediatra, emDias(3, 12), 'Consulta de rotina'],
    [pediatra, emDias(7, 14), 'Vacinação'],
  ].map(([medico, data, descricao]) =>
    Consulta.abrirHorario({ id: randomUUID(), idMedico: medico.id, data, descricao }, agora),
  );
  horarios[2].agendar(paciente.id, agora);
  for (const consulta of horarios) await repositorios.consultas.inserir(consulta);
  return true;
}
