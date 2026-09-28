import Joi from 'joi';

/**
 * Validação de FORMATO das requisições. Regras de negócio (ex.: data no
 * futuro, 24h de antecedência) ficam no domínio, não aqui.
 *
 * Campos desconhecidos são recusados: isso impede, por exemplo, que alguém
 * envie `tipo_usuario: 2` no cadastro e vire administrador.
 */

const id = Joi.string().uuid().messages({ 'string.guid': 'Identificador inválido.' });
// Sem checar a lista de TLDs da IANA: ela desatualiza e recusaria domínios válidos.
const email = Joi.string()
  .trim()
  .email({ tlds: { allow: false } })
  .max(255)
  .messages({
    'string.email': 'Informe um e-mail válido.',
    'string.empty': 'Informe o e-mail.',
  });
// bcrypt só considera os primeiros 72 bytes da senha.
const senha = Joi.string().min(6).max(72).messages({
  'string.min': 'A senha deve ter no mínimo 6 caracteres.',
  'string.max': 'A senha deve ter no máximo 72 caracteres.',
  'string.empty': 'Informe a senha.',
});
const nome = Joi.string().trim().min(1).max(255).messages({ 'string.empty': 'Informe o nome.' });
const dataIso = Joi.date().iso().messages({
  'date.format': 'Informe a data no formato ISO 8601 (ex.: 2026-10-01T14:30:00.000Z).',
  'date.base': 'Informe uma data válida.',
});
const descricao = Joi.string().trim().allow('', null).max(255);

export const esquemas = {
  paramId: Joi.object({ id: id.required() }),

  login: Joi.object({
    email: email.required(),
    senha: Joi.string().required().messages({ 'string.empty': 'Informe a senha.' }),
  }),

  cadastroDePaciente: Joi.object({
    nome: nome.required(),
    email: email.required(),
    senha: senha.required(),
  }),

  atualizacaoDeUsuario: Joi.object({ nome, email, senha })
    .min(1)
    .messages({ 'object.min': 'Informe ao menos um campo para atualizar.' }),

  novaConsulta: Joi.object({
    id_medico: id,
    data: dataIso.required(),
    descricao,
  }),

  edicaoDeConsulta: Joi.object({ data: dataIso, descricao })
    .min(1)
    .messages({ 'object.min': 'Informe a data ou a descrição.' }),

  cancelamento: Joi.object({
    motivo_cancelamento: Joi.string().trim().min(1).max(255).required().messages({
      'string.empty': 'Informe o motivo do cancelamento.',
      'any.required': 'Informe o motivo do cancelamento.',
    }),
  }),

  novaNotificacao: Joi.object({
    id_consulta: id.required(),
    lembrete: Joi.string().trim().min(1).max(1000).required(),
  }),

  filtroDeNotificacoes: Joi.object({ id_consulta: id.required() }),
};
