import Joi from 'joi';

const schema = Joi.object({
    id_medico: Joi.string().uuid().required(),
    id_usuario: Joi.string().uuid().required(),
    data: Joi.date().required(),
    horario: Joi.string().required(),
    tipo_atendimento: Joi.string().required(),
    status_consulta: Joi.string().required(),
    crm: Joi.string().required()
});

export const validarConsulta = (req, res, next) => {
    const { error } = schema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });
    next();
};
