import { TipoUsuario } from '../domain/usuario/enums.js';
import { StatusConsulta } from '../domain/consulta/StatusConsulta.js';
import { AcessoNegadoError } from '../domain/erros.js';

/**
 * Regras de acesso que dependem do DADO (quem é o dono do quê).
 *
 * Regras que dependem só do PERFIL (ex.: "apenas admin lista usuários") ficam
 * nas rotas, via middleware `permitir`. As daqui precisam carregar o recurso
 * antes de decidir, por isso vivem na camada de aplicação.
 *
 * @typedef {{ id: string, tipo: number }} Solicitante  quem fez a requisição
 */

export const ehAdmin = (solicitante) => solicitante.tipo === TipoUsuario.ADMIN;

/** Admin gerencia qualquer agenda; médico, apenas a própria. */
export function exigirGestaoDaConsulta(solicitante, consulta) {
  const ehMedicoResponsavel =
    solicitante.tipo === TipoUsuario.MEDICO && consulta.idMedico === solicitante.id;
  if (!ehAdmin(solicitante) && !ehMedicoResponsavel) {
    throw new AcessoNegadoError(
      'Apenas o médico responsável ou um administrador pode alterar esta consulta.',
    );
  }
}

/** Pacientes enxergam horários livres e as próprias consultas; a clínica, a sua agenda. */
export function podeVerConsulta(solicitante, consulta) {
  switch (solicitante.tipo) {
    case TipoUsuario.ADMIN:
      return true;
    case TipoUsuario.MEDICO:
      return consulta.idMedico === solicitante.id;
    default:
      return (
        consulta.status === StatusConsulta.DISPONIVEL || consulta.idPaciente === solicitante.id
      );
  }
}

export function exigirProprioUsuarioOuAdmin(solicitante, idUsuario) {
  if (!ehAdmin(solicitante) && solicitante.id !== idUsuario) {
    throw new AcessoNegadoError('Você só pode acessar os seus próprios dados.');
  }
}
