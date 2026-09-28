/**
 * Valores numéricos gravados no banco (tabela usuario) e expostos na API.
 * Não altere sem migrar os dados existentes.
 */

/** Perfil de acesso. "Paciente" era chamado de "USUARIO" na versão anterior. */
export const TipoUsuario = Object.freeze({
  PACIENTE: 0,
  MEDICO: 1,
  ADMIN: 2,
});

/** Exclusão é lógica: o registro permanece para preservar o histórico de consultas. */
export const StatusUsuario = Object.freeze({
  ATIVO: 0,
  EXCLUIDO: 1,
});

export const Especialidade = Object.freeze({
  0: 'Cardiologia',
  1: 'Pediatria',
  2: 'Ortopedia',
  3: 'Dermatologia',
  4: 'Neurologia',
});

export const CODIGOS_DE_ESPECIALIDADE = Object.keys(Especialidade).map(Number);
