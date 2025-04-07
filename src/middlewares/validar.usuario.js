import Joi from 'joi';
import { EspecialidaeMedica, tipoUsuario } from '../utils/enums/index.js';


export const validarUsuario = (req, res, next) => {
  const schema = Joi.object({
    nome: Joi.string().required(),
    email: Joi.string().email().required(),
    senha: Joi.string().min(6).required(),
    
    tipo_usuario: Joi.number()
      .valid(...Object.values(tipoUsuario))
      .required(),
  
    especialidade: Joi.number().valid(...Object.keys(EspecialidaeMedica).map(Number)).allow(null),
    crm: Joi.number().integer().allow(null)
  });

  const { error } = schema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });
  next();
};
