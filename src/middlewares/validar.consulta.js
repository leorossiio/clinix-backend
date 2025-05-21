import Joi from 'joi';
import { EspecialidadeMedica } from '../utils/enums/index.js';

export const validarConsulta = (req, res, next) => {
  const schema = Joi.object({
    id_medico: Joi.string().uuid().required().messages({
      'any.required': 'O id do médico é obrigatório',
      'string.uuid': 'O id do médico deve ser um UUID válido',
    }),
    data: Joi.date().iso().required().messages({
      'any.required': 'A data é obrigatória',
      'date.format': 'A data deve estar em formato ISO',
    }),
    descricao: Joi.string().allow('', null).messages({
      'string.base': 'A descrição deve ser um texto',
    }),
  }).unknown(false);

  const { error } = schema.validate(req.body, { abortEarly: true });
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }

  next();
};

export const validarConsultaUpdate = (req, res, next) => {
  const schema = Joi.object({
    id_medico: Joi.string().uuid().messages({
      'string.uuid': 'O id do médico deve ser um UUID válido',
    }),
    data: Joi.date().iso().messages({
      'date.format': 'A data deve estar em formato ISO',
    }),
    descricao: Joi.string().allow('', null).messages({
      'string.base': 'A descrição deve ser um texto',
    }),
  })
    .or('id_medico', 'data', 'descricao') 
    .unknown(false); 

  const { error } = schema.validate(req.body, { abortEarly: true });
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }

  next();
};

export const validarFiltroConsulta = (req, res, next) => {
  const schema = Joi.object({
    id_medico: Joi.string().uuid().messages({
      'string.uuid': 'O id do médico deve ser um UUID válido',
    }),
    data: Joi.date().iso().messages({
      'date.format': 'A data deve estar em formato ISO',
    }),
    descricao: Joi.string().allow('', null).messages({
      'string.base': 'A descrição deve ser um texto',
    }),
    especialidade: Joi.number().valid(...Object.keys(EspecialidadeMedica).map(Number)).messages({
      'number.base': 'A especialidade deve ser um número válido'
    }),
    crm: Joi.string().pattern(/^[0-9]+$/).messages({
      'string.pattern.base': 'O CRM deve conter apenas números'
    })
  }).unknown(false); 

  const { error } = schema.validate(req.body, { abortEarly: true });
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }

  next();
};

export const validarAgendamentoConsulta = (req, res, next) => {
  const schema = Joi.object({
    id_usuario: Joi.string()
      .uuid()
      .required()
      .messages({'string.uuid': 'O ID do usuário deve ser um UUID válido'})
  }).unknown(false); 

  const { error } = schema.validate(req.body, { abortEarly: true });
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }

  next();
};
