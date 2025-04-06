import Joi from 'joi';
import { StatusConsulta } from '../utils/enums/index.js';

export const validarConsulta = (req, res, next) => {
  const schema = Joi.object({
    id_medico: Joi.string().uuid().required(),
    id_usuario: Joi.string().uuid().required(),
    data: Joi.date().iso().required(),
    descricao: Joi.string().allow('', null),
    status: Joi.number().valid(...Object.values(StatusConsulta)).required() 
  });

  const { error } = schema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });
  next();
};
