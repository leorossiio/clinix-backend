import Joi from 'joi';

export const validarUsuarioUpdate = (req, res, next) => {
  const schema = Joi.object({
    nome: Joi.string().optional(),
    email: Joi.string().email().optional(),
    senha: Joi.string().min(6).optional()
  }).min(1); // Garante que pelo menos um campo seja enviado

  const { error } = schema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });
  next();
};