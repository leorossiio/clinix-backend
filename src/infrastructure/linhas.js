import { Consulta } from '../domain/consulta/Consulta.js';
import { Notificacao } from '../domain/notificacao/Notificacao.js';
import { Usuario } from '../domain/usuario/Usuario.js';

/**
 * Conversão entre as linhas das tabelas e as entidades de domínio, comum aos
 * adaptadores Supabase e PostgreSQL (os dois usam o mesmo schema, ver
 * database/migrations). `tempo` converte datas na fronteira (docs/adr/0004).
 *
 * @typedef {{ ler: (valor: unknown) => Date | null, gravar: (instante: Date | null) => string | null }} ConversorDeTempo
 */

export function usuarioParaLinha(usuario) {
  const u = usuario.paraObjeto();
  return {
    id_usuario: u.id,
    nome: u.nome,
    email: u.email,
    senha: u.senhaHash, // a coluna guarda o hash bcrypt, apesar do nome
    tipo_usuario: u.tipo,
    status: u.status,
    especialidade: u.especialidade,
    crm: u.crm,
  };
}

export function linhaParaUsuario(linha) {
  if (!linha) return null;
  return Usuario.reconstituir({
    id: linha.id_usuario,
    nome: linha.nome,
    email: linha.email,
    senhaHash: linha.senha,
    tipo: linha.tipo_usuario,
    status: linha.status,
    especialidade: linha.especialidade,
    crm: linha.crm,
  });
}

/** A coluna do paciente se chama id_usuario por razões históricas. */
export function consultaParaLinha(consulta, tempo) {
  const c = consulta.paraObjeto();
  return {
    id_consulta: c.id,
    id_medico: c.idMedico,
    id_usuario: c.idPaciente,
    data: tempo.gravar(c.data),
    descricao: c.descricao,
    status: c.status,
    motivo_cancelamento: c.motivoCancelamento,
    data_cancelamento: tempo.gravar(c.dataCancelamento),
  };
}

export function linhaParaConsulta(linha, tempo) {
  if (!linha) return null;
  return Consulta.reconstituir({
    id: linha.id_consulta,
    idMedico: linha.id_medico,
    idPaciente: linha.id_usuario,
    data: tempo.ler(linha.data),
    descricao: linha.descricao,
    status: linha.status,
    motivoCancelamento: linha.motivo_cancelamento,
    dataCancelamento: tempo.ler(linha.data_cancelamento),
  });
}

export function notificacaoParaLinha(notificacao, tempo) {
  const n = notificacao.paraObjeto();
  return {
    id_notificacao: n.id,
    id_consulta: n.idConsulta,
    data: tempo.gravar(n.data),
    lembrete: n.lembrete,
  };
}

export function linhaParaNotificacao(linha, tempo) {
  return Notificacao.reconstituir({
    id: linha.id_notificacao,
    idConsulta: linha.id_consulta,
    lembrete: linha.lembrete,
    data: tempo.ler(linha.data),
  });
}
