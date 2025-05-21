import Joi from 'joi';
import { EspecialidadeMedica } from '../utils/enums/index.js';

export const validarUsuario = (req, res, next) => {
  const schema = Joi.object({
    nome: Joi.string().required().messages({
      'string.empty': 'O nome é obrigatório',
    }),
    email: Joi.string().email().required().messages({
      'string.email': 'O e-mail precisa ser válido',
      'string.empty': 'O e-mail é obrigatório',
    }),
    senha: Joi.string().min(6).required().messages({
      'string.min': 'A senha deve ter no mínimo 6 caracteres',
      'string.empty': 'A senha é obrigatória',
    }),
    especialidade: Joi.number()
      .valid(...Object.keys(EspecialidadeMedica).map(Number))
      .optional()
      .allow(null),
    crm: Joi.string().optional().allow(null, ''),
  }).unknown(false);

  const { error } = schema.validate(req.body, { abortEarly: true });
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }

  next();
};


export const validarUsuarioUpdate = (req, res, next) => {
  const schema = Joi.object({
    nome: Joi.string().messages({
      'string.base': 'O nome deve ser um texto',
    }),
    email: Joi.string().email().messages({
      'string.email': 'O e-mail precisa ser válido',
    }),
    senha: Joi.string().min(6).messages({
      'string.min': 'A senha deve ter no mínimo 6 caracteres',
    }),
    especialidade: Joi.number()
      .valid(...Object.keys(EspecialidadeMedica).map(Number))
      .allow(null),
    crm: Joi.string().allow(null, ''),
  })
    .or('nome', 'email', 'senha', 'especialidade', 'crm') // pelo menos um desses campos é necessário
    .unknown(false); // impede campos extras

  const { error } = schema.validate(req.body, { abortEarly: true });
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }

  next();
};
