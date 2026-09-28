/**
 * Convertem entidades no JSON público da API (snake_case, como o banco).
 *
 * São listas explícitas de campos de propósito: um campo novo na entidade não
 * vaza para a API por acidente — foi assim que a versão anterior expunha a
 * coluna `senha` em todas as respostas.
 */

const iso = (data) => data?.toISOString() ?? null;

export const apresentarUsuario = (usuario) => ({
  id_usuario: usuario.id,
  nome: usuario.nome,
  email: usuario.email,
  tipo_usuario: usuario.tipo,
  status: usuario.status,
  especialidade: usuario.especialidade,
  crm: usuario.crm,
});

/** @param {import('../../application/ServicoDeConsultas.js').VisaoDaConsulta} visao */
export const apresentarConsulta = ({ consulta, medico, paciente, reagendavel }) => ({
  id_consulta: consulta.id,
  id_medico: consulta.idMedico,
  id_paciente: consulta.idPaciente,
  data: iso(consulta.data),
  descricao: consulta.descricao,
  status: consulta.status,
  motivo_cancelamento: consulta.motivoCancelamento,
  data_cancelamento: iso(consulta.dataCancelamento),
  reagendavel,
  medico: medico && {
    id_usuario: medico.id,
    nome: medico.nome,
    especialidade: medico.especialidade,
  },
  paciente: paciente && { id_usuario: paciente.id, nome: paciente.nome },
});

export const apresentarNotificacao = (notificacao) => ({
  id_notificacao: notificacao.id,
  id_consulta: notificacao.idConsulta,
  lembrete: notificacao.lembrete,
  data: iso(notificacao.data),
});
