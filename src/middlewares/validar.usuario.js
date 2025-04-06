import Joi from 'joi';
import { ESPECIALIDADES, STATUS, TIPO } from '../enums/index.js';


const schema = Joi.object({
  nome: Joi.string().required(),
  email: Joi.string().email().required(),
  senha: Joi.string().min(6).required(),
  
  tipo_usuario: Joi.number()
    .valid(...Object.values(TIPO)) // 0 = usuario, 1 = medico, 2 = admin
    .required(),

  status: Joi.number()
    .valid(...Object.values(STATUS)) // 0 = ativo, 1 = deletado
    .required(),

  especialidade: Joi.number().valid(...Object.keys(ESPECIALIDADES).map(Number)).allow(null), // ou ajusta conforme enum de especialidades
  crm: Joi.number().integer().allow(null)
});

export const validarUsuario = (req, res, next) => {
  const { error } = schema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });
  next();
};
