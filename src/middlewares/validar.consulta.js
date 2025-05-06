import Joi from 'joi';

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
  }).unknown(false); // impede campos não esperados como id_usuario, status, etc.

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
    .or('id_medico', 'data', 'descricao') // precisa de pelo menos um
    .unknown(false); // bloqueia campos não esperados

  const { error } = schema.validate(req.body, { abortEarly: true });
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }

  next();
};
